const Pool = require('pg').Pool

const pool = new Pool({
    user:"postgres",
    password:"bintang1895",
    database:"db_contacts",
    host:"localhost",
    port:5432
})

module.exports = pool