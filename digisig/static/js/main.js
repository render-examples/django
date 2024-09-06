

// When the user scrolls down 170px from the top of the document, resize the navbar's padding and the logo's font size
// https://www.w3schools.com/howto/howto_js_navbar_slide.asp
window.onscroll = function() {scrollFunction()};

function scrollFunction() {
  if (document.body.scrollTop > 170 || document.documentElement.scrollTop > 170) {
    document.getElementById("navbar").style.background = "black";
  } else {
    document.getElementById("navbar").style.background = "transparent";
  }
}


// the buttons that open and close sections
function toggle(id) {
  var state = document.getElementById(id).style.display;
    if (state == 'block') {
      document.getElementById(id).style.display = 'none';
    } else {
      document.getElementById(id).style.display = 'block';
    }
  } 

// A normal toggle
function tbtoggle(id, button) {
  var state = document.getElementById(id).style.display;
    if (state == 'none') {
      document.getElementById(id).style.display = '';
      document.getElementById(button).innerHTML = '-';
    } else {
      document.getElementById(id).style.display = 'none';
      document.getElementById(button).innerHTML = '+';
    }
  } 

// A set toggle
function settoggle(set, button, close) {

  console.log("function start", set, button, close);

  const collection = document.getElementsByClassName(set);
  const collection2 = document.getElementsByClassName(close);

  var state1 = document.getElementById(button).innerHTML;



  if (state1 == '-') {
    document.getElementById(button).innerHTML = '+';
    console.log("target divs for close", collection2)

    for (let i =0; i <collection2.length; i++) {
      collection2[i].style.display = 'none';
      const buttonset = collection2[i].getElementsByTagName("button");
      if (buttonset.length > 0) {
        console.log("buttons to close", buttonset);
        for (let b =0; b <buttonset.length; b++) {
        console.log("buttontarget", buttonset[b]);
        buttonset[b].innerHTML = '+';
      }
      }
    }


  } else {
    for (let i =0; i <collection.length; i++) {
      console.log("opening", button)
      collection[i].style.display = '';
      document.getElementById(button).innerHTML = '-';      
    }
  }
 
}


// A the map toggle
function maptoggle(id, button) {
  var state = document.getElementById(id).style.display;
    if (state == 'none') {
      document.getElementById(id).style.display = '';
      document.getElementById(button).innerHTML = '-';
      map.invalidateSize();
    } else {
      document.getElementById(id).style.display = 'none';
      document.getElementById(button).innerHTML = '+';
    }
  } 


// A toggle with ajax call for RDF 
function tbtoggle2(id, button) {
  var state = document.getElementById(id).style.display;
    if (state == 'none') {
      document.body.style.cursor = "wait";
    // var rdfaddress = JSON.parse(document.getElementById('rdfajax').textContent);
    var rdfaddress = document.getElementById('rdfajax').textContent;
    // fetch(rdfaddress.url, {
    fetch(rdfaddress, {
        headers:{
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest', //Necessary to work with request.is_ajax()
        },
    })
    .then(response => {
        return response.json() //Convert response to JSON
    })
    .then(data => {
      document.body.style.cursor = "default";
      console.log(data.rdftext);
      document.getElementById(id).style.display = '';
      document.getElementById(button).innerHTML = '-';
      document.getElementById('rdfelement').innerText = data.rdftext;
      console.log(data.rdftext);
        //Perform actions with the response data from the view
    })  


    } else {
      document.getElementById(id).style.display = 'none';
      document.getElementById(button).innerHTML = '+';
    }
  }


// function loadFunction() {
//   console.log("start"); 
// }

//Handling the modal images on pages 
function image(id){

  console.log(id);

  // Get the modal
  searchstr1 = 'myModal' + id;
  var modal = document.getElementById(searchstr1);

  searchstr2 = 'caption' + id;
  var captionText = document.getElementById(searchstr2);

  modal.style.display = "block";
  captionText.innerHTML = img.alt;  
}

// When the user clicks on <span> (x), close the modal
function modalclose(id) {
  searchstr3 = 'myModal' + id;
  var modal2 = document.getElementById(searchstr3);
    modal2.style.display = "none";
}


//An alternate image handler for pages with many modal images on page 
function image2(id, phrase) {

  console.log(id, phrase);

  // Get the modal
  searchstr1 = 'myModal' + phrase + id;
  var modal = document.getElementById(searchstr1);

  searchstr2 = 'caption' + phrase + id;
  var captionText = document.getElementById(searchstr2);

  modal.style.display = "block";
  captionText.innerHTML = img.alt;  
}

// When the user clicks on <span> (x), close the modal
function modalclose2(id, phrase) {
  searchstr3 = 'myModal' + phrase + id;
  var modal2 = document.getElementById(searchstr3);
    modal2.style.display = "none";
}



function serieslistupdate() {
    //check to see if form has a value
    var statusrepository = document.getElementById('id_repository').value;

    if (statusrepository = "") {
        document.getElementById('series_label').style="opacity:0.6";
    } else {
      // as a repository has been selected, enable the series form
      // document.getElementById("series_label").style="opacity:1";
      // document.getElementById("series_options").style="opacity:1";
      // document.getElementById("series_options").disabled = false;      

      //find number of options and limit series list
      var seriesoptionslength = document.getElementById('id_series').options.length;
          var x = document.getElementById('id_series');


        //console.log(series_data[0].fields.fk_repository);
        //console.log(series_data[0].pk);

          for (var j = 0; j < seriesoptionslength; j++) {
          document.getElementById("id_series").options[j].hidden = true;
          var t = document.getElementById("id_series").options[j].value;
        var statusrepository = document.getElementById('id_repository').value;

        for (var key in series_data) {
          if (series_data[key].pk == t) {
            var repositorynumber = series_data[key].fields.fk_repository;
          }
        }

          // var repositorynumber = series_data[j].fields.fk_repository;
          // var seriesnumber2 = series_data[j].pk;
        var repositorynumber2 = Number(repositorynumber);

          if (repositorynumber2 == statusrepository) {
            document.getElementById("id_series").options[j].hidden = false;
          }

      }             
    }
    }

