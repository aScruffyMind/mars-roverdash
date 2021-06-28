const store = {
    rovers: ['Curiosity', 'Opportunity', 'Spirit'],
};

const root = document.getElementById('root');

// const updateStore = (store, newState) => {
//     store = Object.assign(store, newState)
//     // render(root, store)
// };

function addButtonListeners(rover) {
    // this function adds listeners to the forward/back buttons once they are rendered.
    Immutable.List(document.querySelectorAll('.photo-nav')).forEach(x => {
        x.addEventListener('click', () => {
            const thisDate = new Date(document.getElementById('photo-date').innerText);          
            if (x.classList.contains('back')) {
                const newDate = getNewDate(thisDate, 'subtract');
                document.getElementById('photo-date').innerText = newDate;
                checkDate(rover.get('maxDate'), newDate);
                renderPhotos({name: rover.get('name'), photoDate: newDate, maxDate: rover.get('maxDate')});
            } else if (x.classList.contains('forward')) {
                const newDate = getNewDate(thisDate, 'add');
                if(newDate <= rover.get('maxDate')) {
                    document.getElementById('photo-date').innerText = newDate;
                    checkDate(rover.get('maxDate'), newDate);
                    renderPhotos({name: rover.get('name'), photoDate: newDate, maxDate: rover.get('maxDate')});
                }
            }
        });
    });
}

function App (state) {
    // create initial content
    return `
    <header class="column">
            <h1>Mars Rover Dashboard</h1>
            <p>Select a Rover to view details and recent photos.</p>
        </header>
        <nav class="row">
        </nav>
        <div id="stats">
        </div>
        <div id="photos" class="column">
        </div>
        <footer>Data sourced from <a href="https://www.nasa.gov" target="_blank">NASA</a></footer>
    `;
}

function checkDate(maxDate, photoDate) {
    // This is called each time a new photo date is select to grey-out the forward button if 
    // max date and current date match.
    if (maxDate === photoDate) document.querySelector('.forward').classList.add('none-shall-pass');
    else document.querySelector('.forward').classList.remove('none-shall-pass');
}

function firstLoad(state) {
    // fetch data for default rover and render the page.
    fetch(`/rover/${store.rovers[0].toLowerCase()}`)
        .then(res => res.json())
        .then(data => {
            render(root, state, Immutable.Map(data));
        });
}

function getNewDate(earthDate, op) {
    // this changeDate function generates a new date without mutating the original.
    // it is exclusing to the getNewDate function, no outside access.
    const changeDate = (date, op) => {
        if (op === 'subtract') return new Date(date.setDate(date.getDate() - 1));
        else if (op === 'add') return new Date(date.setDate(date.getDate() + 1));
        else return new Date(date);
    };

    const newDate = changeDate(new Date(earthDate), op);
    
    // year, month, and day variables make the return statement easier to read.
    const year = newDate.getUTCFullYear();
    const month = (newDate.getUTCMonth() + 1).toLocaleString('en-US', {minimumIntegerDigits: 2});
    const day = newDate.getUTCDate().toLocaleString('en-US', {minimumIntegerDigits: 2});
    return `${year}-${month}-${day}`;
}

function getRoverManifest(rover, state) {
    // First clear the stats and photos sections.
    document.getElementById('stats').innerHTML = `<img class="loading" src="assets/images/loading.gif" alt="">`;
    document.getElementById('photos').innerHTML = ``;
    
    // Then fetch the Rover manifest.
    fetch(`/rover/${rover}`)
        .then(res => res.json())
        .then(thisRover => {       
            // Then render the stats with the Rover manifest.
            renderStats(Immutable.Map(thisRover));
        });
}

function newEl(el) {
    // Shortcut to create new HTML elements (DRY!)
    return document.createElement(el);
}

function render(root, state, rover) {    
    root.innerHTML = App(state);
    document.getElementsByTagName('nav')[0].appendChild(renderNavItems(state.rovers));
    renderStats(rover);
    document.querySelectorAll('.nav-item').forEach(x => {
        x.addEventListener('click', function () {
            document.querySelector('.selected').classList.remove('selected');
            x.classList.add('selected');
            getRoverManifest(x.innerText, store);
        });
    });
}

function renderNavItems(rovers) {
    // render the navigation items for each rover in store
    let navItems = new DocumentFragment();
    const navItemContainer = newEl('div');
    navItemContainer.classList.add('nav-item-container', 'row');
    rovers.forEach((v, i, a) => {
        const option = newEl('div');
        option.classList.add('nav-item');
        if (i === 0) option.classList.add('selected');
        option.innerText = v;
        navItemContainer.appendChild(option);
    });
    navItems.appendChild(navItemContainer);
    return(navItems);
}

function renderPhotoElement(photo) {
    // Define the elements
    const container = newEl('div');
    const photoCaption = newEl('div');
    const hyperlink = newEl('a');
    const image = newEl('img');

    // Set classes
    container.classList.add('rover-photo-container');
    photoCaption.classList.add('rover-photo-caption');
    image.classList.add('rover-photo');

    // Set attributes
    hyperlink.setAttribute('href', photo.img_src);
    hyperlink.setAttribute('target', '_blank');
    image.setAttribute('src', photo.img_src);
    image.setAttribute('alt', `${photo.camera}, ID ${photo.id}`);

    // Set caption text
    photoCaption.innerText = `${photo.camera}, ID ${photo.id}`;

    // Assemble photo HTML structure
    hyperlink.appendChild(image);
    container.appendChild(hyperlink);
    container.appendChild(photoCaption);

    // Return completed photo HTML structure
    return container;
}

function renderPhotoHeader(rover) {
    // this function renders the photo header with date, forward, and back buttons.
    document.getElementById('photos').innerHTML = `
        <div class="row photo-header">
            <div class="photo-nav back">&lt;&lt;</div>
            <p id="photo-date">${rover.get('maxDate')}</p>
            <div class="photo-nav forward none-shall-pass">&gt;&gt;</div>
        </div>
        <div id="gallery">
        </div>
        `;
    // add listeners to the forward and back buttons now that they exist
    addButtonListeners(rover);

    // render photos for the date selected
    renderPhotos({name: rover.get('name'), photoDate: rover.get('maxDate'), maxDate: rover.get('maxDate')});
}

function renderPhotos(rover) {
    // first set the loading spinner in the gallery
    document.getElementById('gallery').innerHTML = '<img class="loading" src="assets/images/loading.gif" alt="">';
    
    // fetch the photos for selected date
    fetch(`/photos/${rover.name}/${rover.photoDate}`)
        .then(res => res.json())
        .then(data => {
            const photos = Immutable.List(data);          
            const dayPhotos = new DocumentFragment();
            const footer = newEl('footer');            
            footer.innerHTML = `Data sourced from <a href="https://www.nasa.gov" target="_blank">NASA</a>`;
            
            // if there aren't any photos returned, display the shrugging Rover buddy.
            if (photos.size === 0) {
                const npContainer = newEl('div');
                const image = newEl('img');
                image.classList.add('no-photo');
                // no_photo.png drawn by my step daughter, Sarah Ingram. :)
                image.setAttribute('src', '/assets/images/no_photo.png');
                image.setAttribute('alt', 'No photo found');
                npContainer.appendChild(image);
                dayPhotos.appendChild(npContainer);
            }
            document.getElementById('gallery').innerHTML = '';
            
            // create a new Photo element for each photo found in the API call
            photos.forEach((photo, index) => {
                const newPhoto = renderPhotoElement(photo);
                dayPhotos.appendChild(newPhoto);
                // apply a horizontal rule after each photo unless it's the last.
                if(index != photos.size -1) dayPhotos.appendChild(newEl('hr'));
            });

            // add the document fragment to the gallery.
            document.getElementById('gallery').appendChild(dayPhotos);

            // add the footer after the photos (the first time photos are rendered, not every time).
            if (document.getElementsByTagName('footer').length > 1) document.getElementById('photos').appendChild(footer);          
        });
}

function renderStats(thisRover) {
    // render the stats retrieved from the Rover manifest.
    // divided into blocks that stack vertically on mobile, horizontal on tablet+.
    document.getElementById('stats').innerHTML = `
        <div class="stat-block">
        <div class="stat-item row"><span class="stats-key">Status:</span><span id="status" class="stats-value">${thisRover.get('status')}</span></div>
        <div class="stat-item row"><span class="stats-key">Launch Date:</span><span id="launch-date" class="stats-value">${new Date(thisRover.get('launchDate')).toLocaleDateString('en-US', {year: 'numeric', month: 'short', day: 'numeric'})}</span></div>
        <div class="stat-item row"><span class="stats-key">Landing Date:</span><span id="landing-date" class="stats-value">${new Date(thisRover.get('landingDate')).toLocaleDateString('en-US', {year: 'numeric', month: 'short', day: 'numeric'})}</span></div>
        </div>
        <div class="stat-block">
        <div class="stat-item row"><span class="stats-key">Days to Landing:</span><span id="days-to-landing" class="stats-value">${thisRover.get('travelTime')}</span></div>
        <div class="stat-item row"><span class="stats-key">Mission Duration:</span><span id="time-on-mars" class="stats-value">${thisRover.get('missionDuration')}</span></div>
        <div class="stat-item row"><span class="stats-key">Total Photos:</span><span id="total-photos" class="stats-value">${thisRover.get('totalPhotos')}</span></div>
        </.div>`;
    renderPhotoHeader(thisRover);

    // if rover status is active make text green, otherwise red if complete.
    if (thisRover.get('status') === 'active') document.getElementById('status').style.color = 'var(--copacetic-green)';
    else if (thisRover.get('status') === 'complete') document.getElementById('status').style.color = 'var(--red-rover)';

}

window.addEventListener('load', () => {
    // listening for load event because page should load before any JS is called
    firstLoad(store);
});