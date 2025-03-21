import {
  getFirestore,
  collection,
  addDoc,
  setDoc,
  doc,
  updateDoc,
  deleteField,
  deleteDoc,
  getDoc,
  getDocs,
  onSnapshot,
  increment
} from "firebase/firestore";
import { gsap, TimelineMax } from "gsap"; 
import html2canvas from 'html2canvas';
import './style.scss';
import javascriptLogo from './javascript.svg';
import viteLogo from '/vite.svg';
import iconDownloadwhite from './img/icon-download-white.svg';


const db = getFirestore();
const collectionRef = "questions";
const dbRef = collection(db, "questions");

var docRef = "";
let btnDownload = null;
const answers = document.getElementById("answers");

const urlParams = new URLSearchParams(window.location.search);
const questionDoc = urlParams.get('questionDoc');

let modeSocial = urlParams.get('modeSocial') === 'true' ? true : false;



//   console.log(questionDoc);
//   console.log(modeSocial);

if (questionDoc) {
    docRef = questionDoc;

}
else {
    alert("No question found."); 
}

// ------------------------------------------------------------
// GET DATA
// ------------------------------------------------------------
let question = {};
let unsubscribe; // Declare a variable to store the unsubscribe function


const getQuestionOnce = async () => {
    try {
        if (!docRef) {
            console.error("Erreur : docRef est vide.");
            return;
        }

        // 🔥 Création correcte de la référence Firestore
        const questionRef = doc(db, collectionRef, docRef);
        const docSnap = await getDoc(questionRef);

        if (docSnap.exists()) {
        //console.log("Getting question...");
            question = docSnap.data();
            showQuestion(question);
        } else {
        console.log("Aucune question trouvée");
        }
    } catch (error) {
        console.error("Erreur lors de la récupération de la question :", error);
    }
};

// Appel de la fonction après que docRef ait été défini
getQuestionOnce();


// const stopListening = () => {
//     if (unsubscribe) {
//       unsubscribe(); 
//     }
// };

// ------------------------------------------------------------
  // DISPLAY QUESTION AND ANSWERS
  // ------------------------------------------------------------

  const app = document.getElementById("app");

  const showQuestion = (question) => {
      app.innerHTML = "";
      let html = "";

      
      
      html = `
              ${modeSocial ? `
                <button id="download" class="absolute top-2 right-2 bg-zinc-700 hover:bg-neutral-500 aspect-square h-8 rounded-md px-4" title="Télécharger les votes au format PNG">
                <img src="${iconDownloadwhite}" alt="Télécharger les votes au format PNG" class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          </button>
                ` : ''} 
              <span class="block w-full label1 mb-2">Donnez votre avis!</span>
              <span class="block antialiased w-full label2 mb-4">${question.questionTxt}</span>
              <ul id="answers">`;             

      question.answers.forEach((answer, index) => {
          html = html + `
                  <li answer-id="answer${index}" class="answer flex gap-x-2 relative mb-0 cursor-pointer">
                      <span class="relative block bar flex-1 item-center bg-white rounded-md">


                      ${modeSocial ? `
                        <span class="absolute bar-gauge-bg left-0 right-0 block h-1 bottom-0 rounded-full"></span>
                        ` : ''} 
                            
                          <span class="absolute bar-gauge left-0 block h-1 bottom-0 rounded-full"></span>
                          <p class="label3 left-4 w-10/12 pl-4">${question.answers[index]}</p>
                      </span>
                      <span class="percent absolute right-4 top-1/2 -translate-y-1/2"><span class="percent-value">50</span>%</span>
                      
                  </li>`;
      });

      html = html + `</ul><span id="total-votes" class="absolute text-xs left-1/2 -translate-x-1/2 bottom-3"><span id="total-votes-val">100</span><span id="total-votes-txt">votes</span></span>`;
      app.innerHTML += html;

      if (modeSocial) {
            
        socialModeOn();
      }
  };


  

// document.querySelector('#app').innerHTML = `
//   <div>
//     <a href="https://vite.dev" target="_blank">
//       <img src="${viteLogo}" class="logo" alt="Vite logo" />
//     </a>
//     <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript" target="_blank">
//       <img src="${javascriptLogo}" class="logo vanilla" alt="JavaScript logo" />
//     </a>
//     <h1>Hello Vite!</h1>
//     <div class="card">
//       <button id="counter" type="button"></button>
//     </div>
//     <p class="read-the-docs">
//       Click on the Vite logo to learn more
//     </p>
//   </div>
// `


  // ------------------------------------------------------------
  // CLICK ANSWER LIST ITEM
  // ------------------------------------------------------------
  const answerListPressed = (event) => {
    if (!app.classList.contains("voted") && !modeSocial) {
      const closestLi = event.target.closest("li");
      if (!closestLi) return; // Exit if no li element found
      
      const id = closestLi.getAttribute("answer-id").slice(-1);
      updateCounter(id);
      setQuestionVoted();
    }
  };
  app.addEventListener("click", answerListPressed);




  // ------------------------------------------------------------
  // SET QUESTION VOTED TO PREVENT MULTIPLE VOTES
  // ------------------------------------------------------------
  function setQuestionVoted() {
    app.classList.add("voted");
  }

  // ------------------------------------------------------------ 
  // UPDATE COUNTER
  // ------------------------------------------------------------
  var totalVotes = 0;
  const updateCounter = async (id) => {  
    try {
        if (!docRef) {
            console.error("Erreur : docRef est vide.");
            return;
        }

        const questionRef = doc(db, collectionRef, docRef);
        
        // 🔥 Mise à jour atomique avec increment()
        await updateDoc(questionRef, {
            [`counters.${id}`]: increment(1) // Ajoute 1 sans écraser les autres votes
        });

        //console.log("Vote mis à jour avec succès !");

        // 🔄 Relire les données mises à jour pour les afficher
        const updatedDoc = await getDoc(questionRef);
        if (updatedDoc.exists()) {
            displayResults(updatedDoc.data().counters); // ✅ Affichage des nouveaux résultats
        }
    } catch (error) {
        console.error("Erreur lors de la mise à jour du vote :", error);
    }
};

// ------------------------------------------------------------
  // DISPLAY RESULTS AFTER VOTE
  // ------------------------------------------------------------
  const displayResults = (counters) => {

    var barsTl = new TimelineMax({ paused: false });
    var highestKey = null;
    var highestVal = null;
    const $totalVotes = document.getElementById("total-votes");
    const $totalVotesVal = document.getElementById("total-votes-val");
    const $totalVotesTxt = document.getElementById("total-votes-txt");


    


    Object.values(counters).forEach((value) => {
      const currentKey = Object.keys(counters).find(key => counters[key] === value);
      const currentVal = counters[currentKey];
      totalVotes += value;

      if (currentVal > highestVal) {
        highestVal = currentVal;
        highestKey = currentKey;
      }
    });

    Object.keys(counters).forEach((key) => {





      
      const $percent = document.querySelector(`li[answer-id="answer${key}"] .percent`);
      const percent = `${Math.round((counters[key] / totalVotes) * 100)}`
      const $percentVal = document.querySelector(`li[answer-id="answer${key}"] .percent .percent-value`);
      const $barGauge = document.querySelector(`li[answer-id="answer${key}"] .bar .bar-gauge`);
      
    
      if (key === highestKey) {
        $percent.style.opacity = "1";
        $barGauge.style.opacity = "1";
      } else {
        if (modeSocial) {
          
          $percent.style.backgroundColor = "#FF8781";
          $barGauge.style.backgroundColor = "#FF8781";
        } else {
            $percent.style.opacity = "0.25";
            $barGauge.style.opacity = "0.25";
        }
      }
      
      $percentVal.innerHTML = percent;
      

      
      if ($barGauge.parentElement.parentElement.getAttribute("answer-id") === "answer0") {
        barsTl.to($barGauge, 1, { width: percent + '%', ease: "none" });
      }
      else {
        barsTl.to($barGauge, 1, { width: percent + '%', ease: "none" }, "-=1");
      }
    });

    $totalVotesVal.innerHTML = totalVotes;
    $totalVotes.style.opacity = "0.3";
    if (totalVotes === 1) {
      $totalVotesTxt.innerHTML = " vote";
    } else {
      $totalVotesTxt.innerHTML = " votes";
    }

    counting();

  };

 // ------------------------------------------------------------
  // ANIMATE PERCENTAGE VALUES
  // ------------------------------------------------------------
  function counting() {
    document.querySelectorAll('.percent-value').forEach(element => {
      counterUp(element, {
        delay: 10,
        time: 1000
      });
    });
  }

  function counterUp(element, options) {
    const settings = {
      delay: options.delay || 10,
      time: options.time || 1000
    };

    const targetNum = parseInt(element.innerHTML);
    const steps = settings.time / settings.delay;
    const increment = targetNum / steps;
    let currentNum = 0;

    const updateCounter = () => {
      currentNum += increment;
      if (currentNum <= targetNum) {
        element.innerHTML = Math.round(currentNum);
        setTimeout(updateCounter, settings.delay);
      } else {
        element.innerHTML = targetNum;
      }
    };

    element.innerHTML = '0';
    updateCounter();
  }

  // ------------------------------------------------------------
  // DOWNLOAD BUTTON CLICK EVENT
  // ------------------------------------------------------------

  function socialModeOn() {
  
    // setTimeout(() => {
      displayResults(question.counters);
    // }, 2000);
// setTimeout(() => {
//  alert("test");
    btnDownload = document.getElementById("download");

    // app.classList.add("socialMode");
    document.documentElement.classList.add("socialMode");

  btnDownload.addEventListener('click', () => {
    const answersElement = document.querySelector('#answers');
    html2canvas(answersElement, {
      backgroundColor: null,
      scale: 2
    }).then(canvas => {
      const link = document.createElement('a');
      link.download = 'poll-results.png';
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
    });
  });

  // Close the tab after download
  window.close();

// }, 2000);
}


