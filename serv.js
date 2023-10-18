const express = require('express')
const app = express()
app.use(express.static(__dirname + '/public'));
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); 




const { render } = require('ejs');
app.set('view engine', 'ejs');

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore} = require('firebase-admin/firestore');
var serviceAccount = require("./key.json");
initializeApp({
  credential: cert(serviceAccount)
});
const db = getFirestore();

var passwordHash = require('password-hash');


app.get('/', function (req, res) {
  res.sendFile(__dirname+ "/public/"+"welcome.html")
})
app.get('/plogin', (req, res) => {
  res.sendFile(__dirname+ "/public/"+"plogin.html");
});
app.get('/psignup', (req, res) => {
    res.sendFile(__dirname+ "/public/"+"psignup.html");
});
app.get('/dlogin', (req, res) => {
  res.sendFile(__dirname+ "/public/"+"dlogin.html");
});
app.get('/dsignup', (req, res) => {
  res.sendFile(__dirname+ "/public/"+"dsignup.html");
});

app.post('/dsignupsubmit', function (req, res) {  
    const doctorData = {
        dname: req.body.dname,
        dage: req.body.dage,
        dspecial: req.body.dspec,
        dexpert: req.body.dexper,
        dphoneno: req.body.dphone || null,
        dlocation: req.body.dlocation,
        demail: req.body.demail,
        dpassword: passwordHash.generate(req.body.dpassword)
    };

    // Check if a doctor with the same email exists
    db.collection('doctordetails')
        .where("demail", "==", doctorData.demail)
        .get()
        .then((docs) => {
            if (docs.size > 0) {
                res.send("<h1>The account you are trying to sign up already exists. Please login.</h1>");
            } else {
                // No existing doctor with the same email, so add the new doctor
                db.collection('doctordetails')
                    .add(doctorData)
                    .then(() => {
                        res.sendFile(__dirname + "/public/" + "dlogin.html");
                    })
                    .catch((error) => {
                        res.status(500).send("An error occurred: " + error);
                    });
            }
        })
        .catch((error) => {
            res.status(500).send("An error occurred: " + error);
        });
});


app.post('/dloginsubmit', function (req, res) {
  const inputEmail = req.body.demail;
  const inputPassword = req.body.dpassword;
    db.collection('doctordetails')
        .where("demail", "==", inputEmail)
        .get()
        .then((docs) => {
            var verified = false;
            let user = null;

            docs.forEach((doc) => {
                if (passwordHash.verify(inputPassword, doc.data().dpassword)) {
                    verified = true;
                    user = doc.data();
                }
            });

            if (verified) {
                
                res.render("ddashboard", { user });
            } else {
                res.send("Password or email may be incorrect. Please try again.");
            }
        })
        .catch((error) => {
            res.status(500).send("An error occurred: " + error);
        });
});

app.post('/psignupsubmit', function (req, res) {  
  db.collection('persondetails')
  .where("email","==",req.body.pemail)
  .get()
  .then((docs) => {
      if(docs.size>0){
      res.send("<h1>The account You are trying to Signup already exists , please Login</h1>");
      }
      else{
      db.collection('persondetails').add({
      pemail:req.body.pemail,
      ppassword:passwordHash.generate(req.body.ppassword)
  }).then(() =>{
  res.sendFile( __dirname + "/public/" + "plogin.html" );
  })
  }
  })
  })

  app.post('/ploginsubmit', function (req, res) {
    const inputEmail = req.body.pemail;
    const inputPassword = req.body.ppassword;
      db.collection('persondetails')
          .where("pemail", "==", inputEmail)
          .get()
          .then((docs) => {
              var verified = false;
              let user = null;
  
              docs.forEach((doc) => {
                  if (passwordHash.verify(inputPassword, doc.data().ppassword)) {
                      verified = true;
                      user = doc.data();
                  }
              });
  
              if (verified) {
                  
                  res.render("pdashboard", { user });
              } else {
                  res.send("Password or email may be incorrect. Please try again.");
              }
          })
          .catch((error) => {
              res.status(500).send("An error occurred: " + error);
          });
  });




app.post('/search', function (req, res) {
  const location = req.body.searchInput;

  db.collection('doctordetails')
      .where("dlocation", "==", location)
      .get()
      .then((querySnapshot) => {
          const doctorDetails = [];
          querySnapshot.forEach((doc) => {
              doctorDetails.push(doc.data());
          });

          res.send({ doctorDetails });
      })
      .catch((error) => {
          res.status(500).send("An error occurred: " + error);
      });
});
    
app.listen(3000)