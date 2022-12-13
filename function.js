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

app.set('view engine','ejs')//menggunakan ejs
app.use(expressEjsLayouts)//menggunakan expressEjsLayouts
app.use(morgan('dev'))//menggunakan morgan
app.use(express.urlencoded({extended:false}))//menggunakan express.urlencoded
app.use(express.json())

// function untuk menampilkan data dari database 
async function loadContact() {
    try {
        const { rows: contacts } = await pool.query(
            `SELECT * FROM contacts ORDER BY "Name" ASC`
        );
        return contacts;
    } catch (error) {
        console.error('Load contact errror', err.message);
    }
}

// function untuk menghapus data dari database 
const postgredelete = async (deletes) => {
    await pool.query(`DELETE FROM contacts WHERE "Name" = '${deletes}'`)
}

// function untuk cek nama yang duplikat
const duplicate = async (name) => {
    try {
        const { rows: contact } = await pool.query(`SELECT * FROM contacts WHERE "Name" = '${name}'`);
        if (contact.length > 0) {
            console.log(contact[0].Name);
            return contact[0].Name;
        } else {
            return "undefined";
        }
    } catch (err) {
        console.error("func detail : ", err)
    }
}


// fungsi untuk menampilkan data berdasarkan nama
const detail = async (name) => {
    const { rows: contacts } = await pool.query(`SELECT * FROM contacts Where "Name" = '${name}'`);
    return contacts
}

module.exports = {postgredelete, loadContact, duplicate, detail};