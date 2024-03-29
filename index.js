'use strict';

const express = require('express');
const {Sequelize} = require('sequelize');
const crypto = require('crypto');
// See https://github.com/vercel/pkg/issues/141#issuecomment-311746512
require('sqlite3')
require('mysql2')


const APP_PORT = Number(process.env.PORT) || 80
const APP_INTERFACE = process.env.INTERFACE || '0.0.0.0'

const DB_DIALECT = process.env.DB_DIALECT || "memory"
if (!['memory', 'sqlite', 'mysql'].includes(DB_DIALECT)) throw `DB_DIALECT ${DB_DIALECT} is not supported`

const DB_NAME = process.env.DB_NAME
const DB_USERNAME = process.env.DB_USERNAME
const DB_PASSWORD = process.env.DB_PASSWORD
const DB_ADDRESS = process.env.DB_ADDRESS
const DB_PORT = process.env.DB_PORT

const FEATURE_OPTIONAL = process.env.FEATURE_OPTIONAL === "true"
const FEATURE_PREMIUM = process.env.FEATURE_PREMIUM === "true"

let sequelize;

if (DB_DIALECT === 'memory') {
    sequelize = new Sequelize('sqlite::memory:')
}

if (DB_DIALECT === 'sqlite') {
    sequelize = new Sequelize({
        dialect: DB_DIALECT,
        storage: DB_ADDRESS
    });
}

if (DB_DIALECT === 'mysql') {
    sequelize = new Sequelize(DB_NAME, DB_USERNAME, DB_PASSWORD, {
        dialect: DB_DIALECT,
        host: DB_ADDRESS,
        port: Number(DB_PORT)
    })
}

const index = express();
index.set('json spaces', 4)

index.get('/', async (req, res) => {
    const QUERY = 'SELECT 1 + 1;'
    let error = undefined;
    try {
        await sequelize.authenticate()
        await sequelize.query(QUERY)
    } catch (e) {
        console.log(e)
        error = e
    }

    res.status(error ? 500 : 200).json({
        MESSAGE: error ? 'Some error occurred' : "Successfully executed query",
        QUERY,
        ERROR: error,
        DB_DIALECT,
        DB_ADDRESS,
        DB_PORT,
        DB_NAME,
        DB_USERNAME,
        DB_PASSWORD: anonymize(DB_PASSWORD),
        FEATURE_OPTIONAL,
        FEATURE_PREMIUM
    })
});

function anonymize(password) {
    if (password === undefined) return
    try {
        return crypto.createHash('sha256').update(password, 'utf-8').digest('hex').slice(0, 4)
    } catch (e) {
        console.log(e)
        return e
    }
}

index.listen(APP_PORT, APP_INTERFACE, () => {
    console.log(`Listening on ${APP_INTERFACE}:${APP_PORT}`);
});

module.exports = index;
