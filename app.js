const express = require('express')
const expressEjsLayouts = require('express-ejs-layouts')
const app = express()
const port = 3000
const path = require('path')
const morgan = require('morgan')
const fs = require('fs')
const { title } = require('process')
const bodyParser = require('body-parser')
const { check, body, validationResult} = require('express-validator')
const { log } = require('console')
const pool = require('./db')
const call = require('./function')


app.set('view engine','ejs')//menggunakan ejs
app.use(expressEjsLayouts)//menggunakan expressEjsLayouts
app.use(morgan('dev'))//menggunakan morgan
app.use(express.urlencoded({extended:false}))//menggunakan express.urlencoded
app.use(express.json())


// membuat folder data jika belum ada
const dirPath = './data';
if(!fs.existsSync(dirPath)){
    fs.mkdirSync(dirPath);
}

// membuat file contacts.json jika belum ada
const dataPath = './data/contacts.json';
if(!fs.existsSync(dataPath)){
    fs.writeFileSync(dataPath,'[]','utf-8')
}

// fungsi untuk membaca data di dalam json
const readJSON = () => {
  const file = fs.readFileSync('data/contacts.json', 'utf-8')
  const contacts = JSON.parse(file)
  return contacts;
}

// mencari data berdasarkan nama
const detail = (name) => {
  const contacts = readJSON();
  const detcon = contacts.find((data) => data.name === name)
  return detcon
}

// fungsi untuk menyimpan data ke dalam json
const savedata = async (name, email, mobile) => {
  const save = await pool.query(`INSERT INTO contacts ("Name","Email","Mobile")  VALUES ('${name}','${email}','${mobile}')`)
}

// mencari nama yang duplikat
const duplicate = (name) => {
  const contacts = readJSON()
  const duplikat = contacts.find((data) => data.name == name)
  return duplikat
}

// mencari data berdasarkan nama
const findContact = (name) => {
  const cont = readJSON()
  const contact = cont.find((contact) => contact.name === name)
  return contact
}

// menghapus data
const delet = (name) => {
  const contacts = readJSON();
  const fil = contacts.filter((contact) => contact.name !== name)
  fs.writeFileSync('data/contacts.json',JSON.stringify(fil));
}

// mengupdate data
const update = (name, email, mobile, update) => {
  const contacts = readJSON();
  const updt = contacts.find((data) => {
    return data.name == update
  });
  updt.name = name
  updt.email = email
  updt.mobile = mobile

  console.log(updt);

  fs.writeFileSync("data/contacts.json", JSON.stringify(contacts))
}

// membuat file static menjadi public
app.use(express.static(path.join(__dirname,'public')))

// menampilkan waktu
app.use((req, res, next) => {
  console.log('Time:', Date.now())
  next()
})

// menampilkan halaman index
app.get('/', (req,res) => {
  res.render('index', {
    nama : "Bintang Pramudya Farandhi",
    layout: 'template/main',
    title: "Home"
  }) 
})

// menampilkan halaman about
app.get('/about', (req,res) => {
  res.render('about', {
    layout: 'template/main',
    title: 'About'
  })
})

// menampilkan halaman add
app.get('/add', (req,res) => {
  res.render('add', {
    layout: 'template/main',
    title: 'Add New Contact'
  })
})

//menampilkan halaman contact
app.get('/contact', async (req,res) => {
  const cont = await call.loadContact();// memanggil fungsi loadContact
  res.render('contact', {
    cont,
    layout: 'template/main',
    title: "Contact"
  })
})


// menampilkan halaman detail
app.get('/contact/:id', async (req, res) => {
  const getDetail = await call.detail(req.params.id)// memanggil function detail
  res.render('detail', {
    title: "Contact Detail",
    layout: 'template/main',
    getDetail,

  })
})

// menampilkan halaman product
app.get('/product', (req,res) => {
    res.send("Product id : " + req.query.id + '<br><br>' + "Category id : " + req.query.idcat)
})

// mendapatkan data dari page add data
app.post('/added', [
  //validator data nama duplikat
  body('name').custom(async (value) => {
    const duplikat = await call.duplicate(value)
    console.log(duplikat, value);
    if(duplikat == value) {
      throw new Error('Name already taken!')
    }
    return true
  }),
  // validator nama menggunakan isAlpha
  check('name', 'Your name is invalid').isAlpha("en-US", {ignore: " "}),
  // validator email menggunakan isEmail
  check('email', 'Your email is invalid!').not().isEmpty().isEmail(),
  // validator no.hp menggunakan isMobilephone
  check('mobile', 'Your phone number is invalid!').not().isEmpty().isMobilePhone('id-ID')
  ], 
  async (req,res) => {
  // menangkap hasil validasi jika error
  const errors = validationResult(req);

    // jika ada error
    if (!errors.isEmpty()) {
      res.render("add", {
        layout: "template/main",
        title: "Add New Contact",
        errors: errors.array()
      })
    } else { // jika tidak ada error
      savedata(req.body.name, req.body.email, req.body.mobile)
      res.redirect("contact")
    }
})

// mendelete data
app.post('/delete/:name', (req, res) => {
  console.log(req.params.name);
  const contact = call.postgredelete(req.params.name);// memanggil fungsi postgredelete 
  res.redirect('/contact')
})


// menampilkan halaman edit data
app.get("/edit/:name", async (req,res) => {
  const getDetail = await call.detail(req.params.name)// memanggil fungsi detail
  console.log(getDetail)
  const params = req.params.name
  res.render("edit", {
    params,
    layout: "template/main",
    title: "Edit Contact",
    getDetail: getDetail[0],
  })
})

// memasukkan data yang sudah di edit
app.post("/edit/:name", [
  // cek nama duplikat
  body('name').custom(async (value) => {
    const duplikat = await call.duplicate(value)// memanggil function duplicate
    console.log(duplikat, value);
    if(duplikat == value) {
      throw new Error('Name already taken!')
    }
    return true
  }),
  
  // validator nama dengan isAlpha
  check('name', 'Your name is invalid').isAlpha("en-US", {ignore: " "}),
  // validator email dengan isEmail
  check('email', 'Your email is invalid!').not().isEmpty().isEmail(),
  // validator no.hp dengan isMobilePhone
  check('mobile', 'Your phone number is invalid!').not().isEmpty().isMobilePhone('id-ID')
  ],
  
  async (req, res) => {
    // menangkap hasil validasi
    const errors = validationResult(req);
    const getDetail = req.body

    if (!errors.isEmpty()) {// jika ada error
      const params = req.params.name
      res.render("edit", {
        errors: errors.array(),
        layout: "template/main",
        title: "Edit Contact",
        params,
        getDetail
      })
      console.log(errors.array());
    } else { // jika tidak ada error
      let where = req.params.name
      let name = req.body.name
      let email = req.body.email
      let mobile = req.body.mobile
      
      // mengupdate data lama dengan data yang baru 
      await pool.query(`UPDATE contacts SET "Name"='${name}',"Email"='${email}',"Mobile"='${mobile}' WHERE "Name" = '${where}'`)
      res.redirect("/contact") // redirect ke halaman contact
    }
  }
  )

app.get("/addasync", async (req,res) => {
  try {
    const name = "Nathan"
    const email = "nathan@gmail.com"
    const mobile = "03333333333"
    const newCont = await pool.query(`INSERT INTO contacts values ('${name}','${email}','${mobile}') RETURNING *`)
    res.json(newCont)
  } catch (err) {
    console.error(err.message)
  }
})

//menampilkan error 404
app.use('/',(req,res) => {
    res.status(404)
    res.send('Page not found : 404')
})

// membaca port
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})