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


// ------------------------Main Page-----------------------------

app.get('/', function (req, res) {
    res.render('index.ejs');
});


// ----------------------------Write Page--------------------------

app.get('/write', function (req, res) {
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
            _id : numberOfPosts,
            title: req.body.title,
            date: req.body.date,
            content: req.body.content
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
                var temp = numberOfPosts + 1;
                console.log("Total Number of Posts are " + temp);
            });
        });
    });

    res.send('Successfully Sent');
});

// --------------------------List Page----------------------------

app.get('/list', function (req, res) {
    db.collection('post').find().toArray(function (error, result) {
        res.render('list.ejs', {
            posts: result
        });
    });
});