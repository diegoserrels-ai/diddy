// settings.js
// Complete game setup controller


const categories = {


    "Songs": {

        file: "songs.json",

        sports: false

    },


    "Ye Songs": {

        file: "yeSongs.json",

        sports: false

    },


    "Movies": {

        file: "movies.json",

        sports: false

    },


    "Music Artists": {

        file: "musicArtists.json",

        sports: false

    },


    "Athletes": {

        file: "athletes",

        sports: true

    },


    "MLB Players": {

        file: "mlb",

        sports: true

    },


    "NFL Players": {

        file: "nfl",

        sports: true

    },


    "Fast Food Chains": {

        file: "fastFood.json",

        sports: false

    },


    "Food Items": {

        file: "foodItems.json",

        sports: false

    },


    "Alcohol": {

        file: "alcohol.json",

        sports: false

    },

        "Actors": {

        file: "actors.json",

        sports: false

    },


    "Candy": {

        file: "Candy.json",

        sports: false

    },


    "Characters": {

        file: "characters.json",

        sports: false

    },


    "Chips": {

        file: "chips.json",

        sports: false

    },


    "Clothing Brands": {

        file: "clothingbrands.json",

        sports: false

    },


    "Ice Cream": {

        file: "icecream.json",

        sports: false

    },


    "Memes": {

        file: "memes.json",

        sports: false

    },


    "Soft Drinks": {

        file: "SoftDrinks.json",

        sports: false

    },


    "Vacation Spots": {

        file: "vacationSpots.json",

        sports: false

    }


};




// Populate category dropdown

function loadCategories(){


    const dropdown =
    document.getElementById("category");


    dropdown.innerHTML = "";


    Object.keys(categories).forEach(category => {


        let option =
        document.createElement("option");


        option.value = category;


        option.textContent = category;


        dropdown.appendChild(option);


    });



    categoryChanged();


}




// Show/hide sports settings

function categoryChanged(){


    const selected =
    document.getElementById("category").value;


    const sportsBox =
    document.getElementById("sportsModeContainer");



    if(categories[selected].sports){


        sportsBox.style.display = "block";


    } else {


        sportsBox.style.display = "none";


    }


}





// Start game

function startGame(){


    const player1 =
    document.getElementById("player1Name").value.trim();


    const player2 =
    document.getElementById("player2Name").value.trim();



    const category =
    document.getElementById("category").value;



    const budget =
    Number(document.getElementById("budget").value);



    const rosterSize =
    Number(document.getElementById("rosterSize").value);



    if(player1 === ""){


        alert("Player 1 needs a name.");

        return;

    }



    if(player2 === ""){


        alert("Player 2 needs a name.");

        return;

    }



    if(budget < 1){


        alert("Budget must be at least $1.");

        return;

    }



    if(rosterSize < 1){


        alert("Roster size must be at least 1.");

        return;

    }



    let sportsMode = null;



    if(categories[category].sports){


        sportsMode =
        document.getElementById("sportsMode").value;


    }




    const gameSettings = {


        player1: player1,


        player2: player2,


        category: category,


        budget: budget,


        rosterSize: rosterSize,


        sportsMode: sportsMode


    };





    localStorage.setItem(

        "auctionSettings",

        JSON.stringify(gameSettings)

    );





    window.location.href = "game.html";



}