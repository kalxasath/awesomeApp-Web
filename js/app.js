var loader = document.getElementById('loader');
var search = document.getElementById('searchClassmate');
function clearSearch(search) {
    if (search.value == search.defaultValue) {
        search.value = "";
    }
}
function setSearch(input) {
    if (search.value == "") {
        search.value = search.defaultValue;
    }
}


// Initialize Firebase
var config = {
    apiKey: "AIzaSyBVARDFRI7QWempiL8upUd2S-G8s1Uom-o",
    authDomain: "awesomeapp-4ec8d.firebaseapp.com",
    databaseURL: "https://awesomeapp-4ec8d.firebaseio.com",
    projectId: "awesomeapp-4ec8d",
    storageBucket: "awesomeapp-4ec8d.appspot.com",
    messagingSenderId: "523185544926"
};
firebase.initializeApp(config);


/*
 * Login
 */
 // Initialize the FirebaseUI Widget using Firebase.
 var ui = new firebaseui.auth.AuthUI(firebase.auth());

 var uiConfig = {
   callbacks: {
     signInSuccessWithAuthResult: function(authResult, redirectUrl) {
       // User successfully signed in.
       // Return type determines whether we continue the redirect automatically
       // or whether we leave that to developer to handle.
       return true;
     },
     uiShown: function() {
       // The widget is rendered.
       // Hide the loader.
       document.getElementById('loader').style.display = 'none';
     }
   },
   // Will use popup for IDP Providers sign-in flow instead of the default, redirect.
   signInFlow: 'popup',
   signInOptions: [
     // Leave the lines as is for the providers you want to offer your users.
     firebase.auth.GoogleAuthProvider.PROVIDER_ID,
     firebase.auth.GithubAuthProvider.PROVIDER_ID
   ],
   // Terms of service url.
   tosUrl: '<your-tos-url>'
 };

 // The start method will wait until the DOM is loaded.
 ui.start('#firebaseui-auth-container', uiConfig);


 // Select the intro [ Info Summary Div ]
 const loggedInDiv     = document.querySelector(".signedIn");
 const loggedOutDiv    = document.querySelector(".signedOut");
 const userContact     = document.querySelector("#userContact");
 const userPreferences = document.querySelector("#userPreferences");
 const userImage       = document.querySelector("#userImage");
 const event = new Event('change');

 /*
  * LoggedIn / LoggedOut
  */
 firebase.auth().onAuthStateChanged(function(user) {
   if (user) {
     const studentsContainer = document.querySelector(".students");
     search.addEventListener('input', ()=>{
        studentsContainer.innerHTML = '';
        if(search.value) {
            getStudents(studentsContainer, null, 'classmate');
        }
     });
     refreshPageData(user);
   } else {
     loggedInDiv.style.display = "none";
     loggedOutDiv.style.display = "block";
   }
 });

/*
 * initialize user data and refresh page
 */
 const refreshPageData = (user) => {
    return new Promise((resolve, reject) => {
    //Show preloader
    loader.style.display = "flex";

    // Show/Hide based on Auth
    loggedInDiv.style.display = "block";
    loggedOutDiv.style.display = "none";
    console.log(user);

    // Display User Data
    userImage.setAttribute("src", user.photoURL);
    userContact.innerHTML  = `<i class="fas fa-user"></i> ${user.displayName}`;


    // Preferences Fields
    const preferencesForm  = document.querySelector("#preferencesForm");
    const u_slackName      = document.querySelector("#slackName");
    const u_track          = document.querySelector("#tracks");
    const u_currentProject = document.querySelector("#availableProjects");
    const u_langOne        = document.querySelector("#langOne");
    const u_langTwo        = document.querySelector("#langTwo");


    db.doc("Users/" + user.uid + "/").get().then(function(doc) {
        if (doc.exists) {
            const u_tracks_Options = u_track.querySelectorAll('option');

            // User Current Info [ Top Summary ]
            userPreferences.innerHTML = `<i class="fas fa-certificate"></i> ${doc.data().userTrack} <i class="fas fa-bug"></i> ${doc.data().currentProject} <br><i class="fas fa-globe"></i> ${doc.data().languageFirst}, ${doc.data().languageSecond}`;

            // User Current Info [ Preferences Fields ]
            u_slackName.value = doc.data().slackName;
            u_langOne.value = doc.data().languageFirst;
            u_langTwo.value = doc.data().languageSecond;

            // set current track as a selected
            u_tracks_Options.forEach(option => {
                if(option.innerHTML === doc.data().userTrack) {
                    option.setAttribute('selected', '');
                    // call change event when current track is changed
                    u_track.dispatchEvent(event);
                }
            })

            const u_currentProjects = u_currentProject.querySelectorAll('option');
            // set current project as a selected
            u_currentProjects.forEach(project => {
                if(project.innerHTML === doc.data().currentProject) {
                    project.setAttribute('selected', '');
                }
            })

            // console.log("Document data:", doc.data());
        } else {
            // doc.data() will be undefined in this case
            console.log("No such document!");
        }

        resolve(true);
        loader.style.display = "none";
    }).catch(function(error) {
        console.log("Error getting document:", error);
    });

    preferencesForm.addEventListener("submit", function(e) {
        e.preventDefault();
        loader.style.display = "flex";
        writeUserData(user.uid, user.displayName, user.email, u_slackName.value, u_track.value, u_currentProject.value, u_langOne.value, u_langTwo.value);
    }, {once:true});

  });

}

/*
 * Write User Data
 */
function writeUserData(u_id, u_name, u_email, u_slackName, u_track, u_currentProject, u_langOne, u_langTwo) {
    db.doc("Users/" + u_id + "/").set({
      userName: u_name,
      userEmail: u_email,
      slackName: u_slackName,
      userTrack: u_track,
      currentProject: u_currentProject,
      languageFirst: u_langOne,
      languageSecond: u_langTwo
    }).then(function() {
        // location.reload();
        refreshPageData(firebase.auth().currentUser).then(function() {
            loader.style.display = "none";
        })
    }).catch(function(error) {
        console.log("Error: ", error)
    });
}


var db = firebase.firestore();


/*
 * Show all Students in the Selected Project
 * [ Explore ]
 */
function getStudents(containerElement, projectName, queryFlag) {
    let query = queryFlag === 'classmate' ?
             ["slackName", ">=", search.value]:
             ["currentProject", ">=", projectName];

    db.collection("Users").where(...query)
    .orderBy(queryFlag?'slackName':'currentProject')
    .startAt(queryFlag?search.value:projectName)
    .endAt(queryFlag?search.value +"\uf8ff":projectName)
    .get()
    .then(function(querySnapshot) {
        containerElement.innerHTML = '';
        if(querySnapshot.size){
            querySnapshot.forEach(function(doc) {
                const student = document.createElement("ul");
                student.className = "student-card collection";

                const data_contact = document.createElement("li");
                data_contact.className = "collection-item row";
                data_contact.innerHTML = `<div class="col s6"><i class="fab fa-slack-hash"></i> ${doc.data().slackName}</div> <div class="col s6"><a href="https://slack.com/app_redirect?channel=C97PS9WJD" id="go-to-slack" class="waves-effect waves-light btn-small blue-grey darken-4">Go to Slack</a></div>`;

                const data_languages = document.createElement("li");
                data_languages.className = "collection-item row";
                data_languages.innerHTML = `<div class="col s12"><i class="fas fa-globe"></i> ${doc.data().languageFirst}, ${doc.data().languageSecond}</div>`;



                student.appendChild(data_contact);
                if(queryFlag) {
                    const workingProject = document.createElement("li");
                    workingProject.className = "collection-item row";
                    const currentTrack = document.createElement("li");
                    currentTrack.className = "collection-item row";
                    currentTrack.innerHTML = `<div class="col s12"><i class="fas fa-certificate"></i> ${doc.data().userTrack}</div>`;
                    workingProject.innerHTML = `<div class="col s12"><i class="fas fa-bug"></i> ${doc.data().currentProject}</div>`;
                    student.appendChild(currentTrack);
                    student.appendChild(workingProject);
                }

                student.appendChild(data_languages);
                containerElement.appendChild(student);

            });
        }else{
            const student = document.createElement("ul");
            student.className = "student-card collection";
            const notFound = document.createElement("li");
            notFound.className = "collection-item row";
            notFound.innerHTML = `<div class="col s12 notfound"><i class="small material-icons .fab">error_outline</i> It seems we could not find anything</div>`;
            student.appendChild(notFound);
            containerElement.appendChild(student);
        }
    })
    .catch(function(error) {
        console.log("Error getting documents: ", error);
    });
}


/*
 * Get All Data
 * [ Preferences & Explore ]
 */
db.doc("helpData/tracks").get().then(function(doc) {
    const myData = doc.data();
    // console.log(myData);

    /*
     * Preferences
     */

    // Tracks
    const tracks = document.querySelector("#tracks");
    optionFiedCreator(myData.tracksArray, tracks);

    // Get Available Projects based on the selected Track
    const availableProjects = document.querySelector("#availableProjects");
    tracks.addEventListener("change", function() {
        getAvailableProjects(myData, tracks, availableProjects);
    });

    // Languages
    const langOne = document.querySelector("#langOne");
    optionFiedCreator(myData.langsArray, langOne);
    const langTwo = document.querySelector("#langTwo");
    optionFiedCreator(myData.langsArray, langTwo);



    /*
     * Explore
     */

    // Tracks
    const tracksContainer = document.querySelector(".tracks");
    myData.tracksArray.forEach(function (value) {
        const track = document.createElement("div");
        track.className = "track col s6 m3 center-align";
        const trackBtn = document.createElement("button");
        trackBtn.className = "track-button waves-effect waves-light btn-large blue-grey darken-4";
        trackBtn.innerHTML = value;
        trackBtn.setAttribute("data-value", value);
        track.appendChild(trackBtn);
        tracksContainer.appendChild(track);
    });


    // Track Buttons
    const trackButtons = document.querySelectorAll(".track-button");

    // Projects Container
    const projectsContainer = document.querySelector(".projects");

    for(let i = 0; i < trackButtons.length; i++) {
        trackButtons[i].addEventListener("click", function() {
            const trackName = this.getAttribute("data-value");

            // Display the projects based on the clicked Track
            switch(trackName) {
                case "AND":
                    projectsContainer.innerHTML = "";
                    getProjects(myData.andProjectsArray, projectsContainer, "AND");
                break;
                case "ABND":
                    projectsContainer.innerHTML = "";
                    getProjects(myData.abndProjectsArray, projectsContainer, "ABND");
                break;
                case "FEND":
                    projectsContainer.innerHTML = "";
                    getProjects(myData.fendProjectsArray, projectsContainer, "FEND");
                break;
                case "MWS":
                    projectsContainer.innerHTML = "";
                    getProjects(myData.mwsProjectsArray, projectsContainer, "MWS");
                break;
            }
        });
    }

}).catch(function (error) {
    console.log("Got an error: ", error);
});


/*****************************
****** Helper Functions ******
******************************/


/*
 * Option Field Creator [ Create and Fill it with Data ]
 */
function optionFiedCreator(arrayOfData, containerElement) {
    arrayOfData.forEach(function (entry) {
        const option = document.createElement("option");
        option.setAttribute("value", entry);
        option.innerHTML = entry;
        containerElement.appendChild(option);
    }
)}

/*
 * Display All Related Projects
 */
function getProjects(arrayOfData, containerElement, trackName) {
    arrayOfData.forEach(function(data) {
        const project = document.createElement("button");
        project.className = "project-button waves-effect waves-light btn-large blue-grey darken-3";
        project.setAttribute("data-track", trackName);
        project.setAttribute("data-project", data);
        project.innerHTML = data;
        containerElement.appendChild(project);
    });

    // Project Buttons
    const projectButtons = document.querySelectorAll(".project-button");

    // Students Container
    const studentsContainer = document.querySelector(".students");

    for(let i = 0; i < projectButtons.length; i++) {
        projectButtons[i].addEventListener("click", function() {
            const trackName = this.getAttribute("data-track");
            const projectName = this.getAttribute("data-project");
            console.log("Clicked Project: ", projectName);
            getProjectNames(trackName);
            // Show all people who are working on the Selected Project
            switch(trackName) {
                case "AND":
                    for(let x  = 0; x < andProjects.length; x++) {
                        switch(projectName) {
                            case andProjects[x]:
                                studentsContainer.innerHTML = "";
                                getStudents(studentsContainer, andProjects[x]);
                            break;
                        }
                    }
                break;
                case "ABND":
                    for(let x  = 0; x < abndProjects.length; x++) {
                        switch(projectName) {
                            case abndProjects[x]:
                                studentsContainer.innerHTML = "";
                                getStudents(studentsContainer, abndProjects[x]);
                            break;
                        }
                    }
                break;
                case "FEND":
                    for(let x  = 0; x < fendProjects.length; x++) {
                        switch(projectName) {
                            case fendProjects[x]:
                                studentsContainer.innerHTML = "";
                                getStudents(studentsContainer, fendProjects[x]);
                            break;
                        }
                    }
                break;
                case "MWS":
                    for(let x  = 0; x < mwsProjects.length; x++) {
                        switch(projectName) {
                            case mwsProjects[x]:
                                studentsContainer.innerHTML = "";
                                getStudents(studentsContainer, mwsProjects[x]);
                            break;
                        }
                    }
                break;
            }
        });
    }
}


/*
 * Get Project Names
 */
let andProjects,
    abndProjects,
    fendProjects,
    mwsProjects;
function getProjectNames(track) {
    db.collection("helpData").get().then(function(querySnapshot) {
        querySnapshot.forEach(function(doc) {
            andProjects = doc.data().andProjectsArray;
            abndProjects = doc.data().abndProjectsArray;
            fendProjects = doc.data().fendProjectsArray;
            mwsProjects = doc.data().mwsProjectsArray;
        });
    })
    .catch(function(error) {
        console.log("Error getting documents: ", error);
    });
}
getProjectNames();


/*
 * Display projects based on Track
 * [ Preferences ]
 */
function getAvailableProjects(db, tracks, container) {
    switch(tracks.value) {
        case "AND":
            container.innerHTML = "";
            optionFiedCreator(db.andProjectsArray, container);
        break;
        case "ABND":
            container.innerHTML = "";
            optionFiedCreator(db.abndProjectsArray, container);
        break;
        case "FEND":
            container.innerHTML = "";
            optionFiedCreator(db.fendProjectsArray, container);
        break;
        case "MWS":
            container.innerHTML = "";
            optionFiedCreator(db.mwsProjectsArray, container);
        break;
    }
}

/*
 * Logout
 */
document.querySelector("#signout").addEventListener("click", function() {
    firebase.auth().signOut().then(function() {
        location.reload();
    }, function(error) {
        console.error('Sign Out Error', error);
    });
});



/*****************************
********* UI Stuff ***********
******************************/
$(document).ready(function(){
    $('.tabs').tabs();
    $('select').formSelect();
    $('.modal').modal();
    $('.sidenav').sidenav();
});

const signedOutContainer = document.querySelector(".signedOut");
signedOutContainer.style.height = window.innerHeight + "px";