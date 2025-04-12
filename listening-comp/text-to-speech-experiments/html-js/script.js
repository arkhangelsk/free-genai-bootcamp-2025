const scenes = [
  {
    title: "Good Morning, Amal!",
    arabic: "صباح الخير يا أمل",
    sound: "audio/good_morning.mp3",
  },
  {
    title: "Brushing Teeth",
    arabic: "فرشت أسناني",
    sound: "audio/brushing_teeth.mp3",
  },
  {
    title: "Breakfast Time",
    arabic: "فطوركِ حاضر",
    sound: "audio/breakfast.mp3",
  },
  {
    title: "Leaving for School",
    arabic: "صباح النور يا أمل",
    sound: "audio/school.mp3",
  },
];

let currentScene = 0;

const titleElement = document.getElementById("title");
const arabicElement = document.getElementById("arabic");
const playSoundButton = document.getElementById("play-sound");
const nextButton = document.getElementById("next");

function updateScene() {
  titleElement.textContent = scenes[currentScene].title;
  arabicElement.textContent = scenes[currentScene].arabic;
}

playSoundButton.addEventListener("click", () => {
  const audio = new Audio(scenes[currentScene].sound);
  audio.play();
});

nextButton.addEventListener("click", () => {
  currentScene = (currentScene + 1) % scenes.length;
  updateScene();
});

updateScene();
