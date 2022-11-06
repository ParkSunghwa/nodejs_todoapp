// ----------------intalled libraries--------------


// express
const express = require('express');
const app = express();

// mongodb
const MongoClient = require('mongodb').MongoClient;
MongoClient.connect('mongodb+srv://mtreeferryp:gk738151@cluster0.kreh1oa.mongodb.net/?retryWrites=true&w=majority', function (error, client) {
    if (error) {
        return console.log(error);
    }
    db = client.db('nodejs_todoapp');
    app.listen(8080, function () {
        console.log("Listening on 8080");
    })
});

// ejs
app.set('view engine', 'ejs');

// body-parser
const bodyParser = require('body-parser');
app.use(express.urlencoded({
    extended: true
}));

// method-override
const methodOverride = require('method-override');
const {
    json
} = require('express');
app.use(methodOverride('_method'));

// public css
app.use('/public', express.static('public'));


// passport, passport-local, express-session
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
// 미들웨어 이용
// 웹서버는 요청-응답해주는 머신인데, 요청과 응답 사이에 무언가 실행해주고 싶으면 쓰는 것이 미들웨이이다.
// 아래 코드는 passport가 제공하는 미들웨어이다.
app.use(session({
    // 비밀번호는 아무거나 쓰면 된다.(secret)
    secret: 'secret-code',
    resave: true,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());


// ------------------------Main Page-----------------------------

app.get('/', function (req, res) {
    res.render('index.ejs');
});

// -----------------------Login Page------------------------------

app.get('/login', function (req, res) {
    res.render('login.ejs');
});

app.post('/login', passport.authenticate('local', {
    failureRedirect: '/fail'
}), function (req, res) {
    res.redirect('/');
});
passport.use(new LocalStrategy({
    // 로그인 페이지 폼에 작성한 아이디와 비밀번호의 name 값
    usernameField: 'id',
    passwordField: 'pw',
    // 세션 저장 여부
    session: true,
    // 아이디 패스워드 말고도 이름 같은걸 추가로 검증하고자 할 시 true로. 다음 콜백함수에서 req로 받아볼 수 있다.
    passReqToCallback: false,
}, function (idWritten, pwWritten, done) {
    // done()은 그냥 이 라이브러리 문법이다.
    // done(서버에러, 성공시 사용자 DB 데이터(안맞으면 false), 에러 메세지)
    //console.log(입력한아이디, 입력한비번);
    db.collection('login').findOne({
        id: idWritten
    }, function (error, result) {
        if (error) return done(error)

        if (!result) return done(null, false, {
            message: "ID doesn't exist"
        })
        // 원래는 비번을 암호화해서 저장하고 비교해야 한다.
        if (pwWritten == result.password) {
            return done(null, result)
        } else {
            return done(null, false, {
                message: 'Wrong password'
            })
        }
    })
}));
// 검사 후 로그인 상태를 유지하고 싶을 때(로그인 성공시 발동)
passport.serializeUser(function (user, done) {
    done(null, user.id)
});

//   마이페이지 진입시 인증하는 방법
passport.deserializeUser(function (userId, done) {
    // 아이디와 비밀번호 말고도 다른 유저 정보를 찾고 싶을 때 쓴다.
    db.collection('login').findOne({
        id: userId
    }, function (error, result) {
        done(null, result)
    })
});


//   -------------------------Sign Up Page----------------------

app.get('/signup', function (req, res) {
    res.render('signup.ejs');
});

app.post('/signup', function (req, res) {
    // 정보를 모두 정확히 입력했는지
    if (req.body.id == "" || req.body.pw == "") {
        res.send("Fill in all the required information")
    } else {
        db.collection('login').findOne({
            id: req.body.id
        }, function (error, result) {
            if (error) {
                console.log(error);
            } else if (result != null) {
                res.send("ID '" + req.body.id + "' already exists")
            } 
            else {
                db.collection('login').insertOne({
                    id: req.body.id,
                    password: req.body.pw
                }, function (error, result) {
                    if (error) {
                        console.log(error);
                    } else {
                        console.log(req.body.id + " has signed up")
                    }
                    res.redirect('/');
                });
            }
        });
    }

});
// ----------------------------Write Page--------------------------

app.get('/write', didYouLogin, function (req, res) {
    res.render('write.ejs');
});

app.post('/add', function (req, res) {
    // 몇번째 게시물인지 카운터를 확인한다.
    db.collection('counter').findOne({
        name: 'number-of-posts'
    }, function (error, result) {
        var numberOfPosts = result.counter

        // db의 post에 해당 데이터를 집어넣는다.
        db.collection('post').insertOne({
            _id: numberOfPosts + 1,
            title: req.body.title,
            date: req.body.date,
            content: req.body.content,
        }, function (error, result) {
            if (error) {
                return console.log(error);
            }
            console.log("'" + req.body.title + "' has been saved on " + req.body.date);

            // counter +1
            db.collection('counter').updateOne({
                name: 'number-of-posts'
            }, {
                $inc: {
                    counter: 1
                }
            }, function (error, result) {
                if (error) {
                    return console.log(error);
                }
                db.collection('post').count({}, function (error, result) {
                    console.log("Total Number of posts is " + result);
                });

            });
        });
    });

    res.render('success_write.ejs');
});

// --------------------------List Page----------------------------

app.get('/list', function (req, res) {
    db.collection('post').find().toArray(function (error, result) {
        res.render('list.ejs', {
            posts: result
        });
    });
});


// --------------------------Detail Page---------------------------

app.get('/detail/:number', function (req, res) {
    db.collection('post').findOne({
        _id: parseInt(req.params.number)
    }, function (error, result) {
        if (error) {
            return console.log(error);
        } else if (result == null) {
            res.send('404 not found');
        } else {
            res.render('detail.ejs', {
                data: result
            });
        }
    })
});
// Delete
app.delete('/delete/:number', function (req, res) {
    var postNumber = parseInt(req.params.number);
    db.collection('post').deleteOne({
        _id: postNumber
    }, function (error, result) {
        console.log("Post Number " + postNumber + " has been deleted");
    });
    res.status(200).send({
        message: "Successfully Deleted"
    })
});



// Delete-success
app.get('/delete-success', function (req, res) {
    res.render('success_delete.ejs');
});

// Edit

app.get('/edit/:number', function (req, res) {
    db.collection('post').findOne({
        _id: parseInt(req.params.number)
    }, function (error, result) {
        if (error) {
            console.log(error);
        } else if (result == null) {
            res.send("404 not found");
        } else {
            res.render('edit.ejs', {
                data: result
            });
        }
    });
});

app.put('/edit', function (req, res) {
    db.collection('post').updateOne({
        _id: parseInt(req.body.id)
    }, {
        $set: {
            title: req.body.title,
            date: req.body.date,
            content: req.body.content
        }
    }, function (error, result) {
        if (error) {
            return console.log(error);
        } else {
            console.log("Post " + req.body.id + " has been edited");
            res.render('success_edit.ejs');
        }
    });
});


// -----------------My Page------------------------

function didYouLogin(req, res, next) {
    if (req.user) {
        next();
    } else {
        res.send("You have to login first");
    }
}

app.get('/mypage', didYouLogin, function (req, res) {
    res.render('mypage.ejs', {
        userInfo: req.user
    });
});