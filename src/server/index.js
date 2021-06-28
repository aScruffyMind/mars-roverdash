// jshint esversion: 8

const Immutable = require('immutable');
const dotenv = require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const port = (process.env.PORT) ? process.env.PORT : 3000;

app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());

app.use('/', express.static(path.join(__dirname, '../public')));

// Calculate number of days between two dates
function daysBetween(start, end) {
    return Number(((end - start) / (24 * 60 * 60 * 1000)).toFixed(0)).toLocaleString('en-US');
}

// Rover constructor function
function Rover(rover) {
    this.name = rover.name;
    this.launchDate = rover.launch_date;
    this.landingDate = rover.landing_date;
    this.status = rover.status;
    this.maxDate = rover.max_date;
    this.missionDuration = `${daysBetween(new Date(rover.landing_date), new Date(rover.max_date))} days`;
    this.travelTime = `${daysBetween(new Date(rover.launch_date), new Date(rover.landing_date))} days`;
    this.totalPhotos = Number(rover.total_photos).toLocaleString('en-US');
}

// Retrieve rover information
app.get('/rover/:name', async (req, res) => {
    try {
        await fetch(`https://api.nasa.gov/mars-photos/api/v1/manifests/${req.params.name}/?api_key=${process.env.API_KEY}`)
            .then(res => res.json())
            .then(data => res.send(Immutable.Map(new Rover(data.photo_manifest))));
    } catch (err) {
        console.log('error: ', err);
    }
});

// Retrieve rover photos for date
app.get('/photos/:name/:date', async (req, res) => {
    try {
        await fetch(`https://api.nasa.gov/mars-photos/api/v1/rovers/${req.params.name}/photos?earth_date=${req.params.date}&api_key=w6XsOPxbyoqvmDAiYnaaImupw6igfShp3E0XS7wC`)
            .then(res => res.json())
            .then(data => {
                res.send(Immutable.List(data.photos.map(photo => (
                    Immutable.Map({
                        id: photo.id,
                        camera: photo.camera.name,
                        img_src: photo.img_src,
                        photo_date: photo.earth_date
                    })
                ))));
            });
    } catch (err) {
        console.log('error: ', err);
    }
});

app.listen(port, () => console.log(`Mars rover dashboard listening on port ${port}!`));