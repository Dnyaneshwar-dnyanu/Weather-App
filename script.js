
function handleAPIError() {
     document.querySelector('.error').style.display = "flex";
     document.querySelector('main').style.display = "none";
     document.getElementById('loader').style.display = "none";
     document.getElementById('weather').style.display = "block";
}

function handleAPISuccess() {
     document.getElementById('weather').style.display = "none";
     document.querySelector('.error').style.display = "none";
     document.querySelector('main').style.display = "block";
     document.getElementById('loader').style.display = "inline-block";
}

let statusFound = true;

async function getLongLat(placeName) {

     const urlToLongLat = `https://geocoding-api.open-meteo.com/v1/search?name=${placeName}&count=1&language=en&format=json`;

     let res = await fetch(urlToLongLat);
     let data = await res.json();

     if (data.results) {
          let latitude = data.results[0].latitude;
          let longitude = data.results[0].longitude;
          let country = data.results[0].country;

          document.querySelector('.status').style.display = "none";
          document.querySelector('.weather-container').style.display = "flex";
          return { longitude, latitude, country };
     }
     else {
          console.log('Place not found');
          statusFound = false;
     }
}


let labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
let dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
let hourlyData = {
     Sun: {}, Mon: {}, Tue: {}, Wed: {}, Thu: {}, Fri: {}, Sat: {}
};

async function getWeather(placeName, tempUnit, windUnit, precipitationUnit) {
     try {

          document.getElementById('loader').style.display = "block";
          document.getElementById('weather').style.display = "none";

          let location, locationDetails;
          if (placeName.length > 0) {
               location = await getLongLat(placeName);
          }
          else {
               location = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(
                         (position) => {
                              resolve({
                                   longitude: position.coords.longitude,
                                   latitude: position.coords.latitude
                              });
                         },
                         (error) => reject(error.message)
                    );
               });

               const urlToPlaceName = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.latitude}&lon=${location.longitude}&zoom=18&addressdetails=1`;

               let response;

               response = await fetch(urlToPlaceName, {
                    headers: {
                         "User-Agent": "MyWeatherApp/1.0 (dnyanu0506@gmail.com)"
                    }
               });
               locationDetails = await response.json();
          }

          const urlToWeatherData = `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&daily=temperature_2m_max,temperature_2m_min,weather_code&hourly=temperature_2m,wind_speed_10m,relative_humidity_2m,apparent_temperature,precipitation,weather_code&current=is_day,weather_code&timezone=GMT&wind_speed_unit=${windUnit}&temperature_unit=${tempUnit}&precipitation_unit=${precipitationUnit}`;

          let res, data;

          res = await fetch(urlToWeatherData);
          data = await res.json();

          let today = new Date();
          let currentHour = today.toISOString().slice(0, 13) + ':00';
          let index = data.hourly.time.indexOf(currentHour);
          let tempNow = parseInt(data.hourly.temperature_2m[index]) + data.hourly_units.temperature_2m;
          let windSpeed = data.hourly.wind_speed_10m[index] + data.hourly_units.wind_speed_10m;
          let humidity = data.hourly.relative_humidity_2m[index] + data.hourly_units.relative_humidity_2m;
          let feelsLike = data.hourly.apparent_temperature[index] + data.hourly_units.apparent_temperature;
          let precipitation = data.hourly.precipitation[index] + data.hourly_units.precipitation;

          let units = data.daily_units.temperature_2m_max;
          let daily = data.daily;

          let i = 0;
          while (i < data.hourly.time.length) {
               let day = (new Date(data.hourly.time[i])).getDay();
               let label = labels[day];
               hourlyData[label].time = data.hourly.time.slice(i, i + 24);
               hourlyData[label].temperature_2m = data.hourly.temperature_2m.slice(i, i + 24);
               hourlyData[label].weather_code = data.hourly.weather_code.slice(i, i + 24);
               i = i + 24;
          }

          let hourly = data.hourly;
          let current = data.current;

          let locationName = placeName.length > 0 ? placeName + ', ' + location.country : locationDetails.address.county + ', ' + locationDetails.address.country;
          let dateNow = today.toString().slice(0, 15);


          handleAPISuccess();
          return { locationName, dateNow, tempNow, windSpeed, humidity, feelsLike, precipitation, hourly, hourlyData, daily, current, units };

     }
     catch (error) {
          if (statusFound) {
               handleAPIError();
          }
          else {
               console.error("Error fetching weather:", error);
               document.querySelector('.status').style.display = "inline-block";
               document.querySelector('.weather-container').style.display = "none";
               document.getElementById('weather').style.display = "block";
               document.getElementById('loader').style.display = "none";
               document.getElementById('searchSuggestion').innerHTML = "";
          }
     }
}

// Animated icons
// https://basmilius.github.io/weather-icons/index-fill.html

function getWeatherIcon(code, isDay) {
     if (code === 0) return isDay ? "sun.svg" : "moon.svg";

     if ([1, 2, 3].includes(code)) return isDay ? "cloudy-day.svg" : "cloudy-night.svg";

     if ([45, 48].includes(code)) return "fog.svg";

     if ([51, 53, 55, 56, 57].includes(code)) return "drizzle.svg";

     if ([61, 63, 65, 66, 67].includes(code)) return "rain.svg";

     if ([71, 73, 75, 77].includes(code)) return "snow.svg";

     if ([80, 81, 82].includes(code)) return "showers.svg";

     if ([85, 86].includes(code)) return "snow-showers.svg";

     if (code === 95) return "thunderstorm.svg";

     if ([96, 99].includes(code)) return "hailstorm.svg";

     return "na.svg";
}


function addHourlyDataToList(label) {
     let hours = new Date().getHours();
     let ampm = hours >= 12 ? "PM" : "AM";
     let i = ampm == "AM" ? 0 : 12;

     document.querySelectorAll('.hourly-forecast-values > li').forEach(li => {
          let hour = parseInt(hourlyData[label].time[i].slice(11, 13), 10);
          let temp = parseInt(hourlyData[label].temperature_2m[i], 10);
          let weather_code_value = hourlyData[label].weather_code[i];
          time = hour % 12;
          if (time == 0) { time = 12 }

          li.innerHTML = `
                    <span class="hourly-forecast-icons"><img src="/images/${getWeatherIcon(weather_code_value)}" alt="">${time} ${ampm}</span><span>${temp}&deg;</span>`;

          i++;
     });

     document.querySelectorAll('.daily-forecast-container .forecast-desc-box').forEach(div => {
          if (div.hasAttribute('class', 'activeDay')) {
               div.classList.remove('activeDay');
               return;
          }
     });

     let div = document.querySelector(`.daily-forecast-container #${label}`);
     div.classList.add('activeDay');
}

async function setWeather(placeName, tempUnit, windUnit, precipitationUnit, day) {
     let temperatureNow = document.getElementById('temperatureNow');
     let location = document.getElementById('location');
     let dateNow = document.getElementById('dateNow');
     let windSpeed = document.getElementById('windSpeed');
     let humidity = document.getElementById('humidity');
     let feelsLike = document.getElementById('feelsLike');
     let precipitation = document.getElementById('precipitation');
     let days = document.querySelector('.daily-forecast-container');
     let hourlyForecast = document.querySelector('.hourly-forecast-content > .hourly-forecast-values');
     let currentIcon = document.querySelector('.todays-weather-now img');
     let todaysWeatherIcon = document.querySelector('.todays-weather-now img');
     let dayName = document.querySelector('.drop_down_days .daySelected');

     let weatherData = await getWeather(placeName, tempUnit, windUnit, precipitationUnit);
     dateNow.textContent = weatherData.dateNow;
     temperatureNow.textContent = weatherData.tempNow;
     location.textContent = weatherData.locationName;
     windSpeed.textContent = weatherData.windSpeed;
     humidity.textContent = weatherData.humidity;
     feelsLike.textContent = weatherData.feelsLike;
     precipitation.textContent = weatherData.precipitation;
     currentIcon.src = getWeatherIcon(weatherData.current.weather_code, weatherData.current.is_day);
     todaysWeatherIcon.src = '/images/' + getWeatherIcon(weatherData.current.weather_code, weatherData.current.is_day);

     let daysHTML = "", hourlyHTML = "";

     weatherData.daily.time.forEach((day, index) => {
          let today = dayNames[(new Date(day)).getDay()];

          daysHTML += `<div id="${today.substring(0, 3)}" class="forecast-desc-box ${index == 0 ? "activeDay" : ""}">
                                   <h4 class="day">${today.substring(0, 3)}</h4>
                                   <img src="/images/${getWeatherIcon(weatherData.daily.weather_code[index], weatherData.current.is_day)}" alt="">
                                   <div class="forecast-values">
                                        <span class="highTemp">${parseInt(weatherData.daily.temperature_2m_max[index])}&deg;</span>
                                        <span class="lowTemp">${parseInt(weatherData.daily.temperature_2m_min[index])}&deg;</span>
                                   </div>
                              </div>`;

     });

     days.innerHTML = daysHTML;

     let hours = (new Date()).getHours();
     let ampm = hours >= 12 ? "PM" : "AM";
     let startHour = 0;

     if (ampm == "PM") {
          startHour = 12;
     }

     // let label = labels[];
     dayName.textContent = dayNames[day];
     let label = labels[day];

     for (let i = startHour; i < startHour + 12; i++) {
          let hour = parseInt(weatherData.hourlyData[label].time[i].slice(11, 13), 10);
          let time = hour % 12;
          if (time == 0) {
               time = 12;
          }

          let temp = parseInt(weatherData.hourlyData[label].temperature_2m[i], 10);
          hourlyHTML += `<li><span class="hourly-forecast-icons"><img src="/images/${getWeatherIcon(weatherData.hourly.weather_code[i], weatherData.current.is_day)}" alt="">${time} ${ampm}</span><span>${temp}&deg;</span></li>`
     }

     hourlyForecast.innerHTML = hourlyHTML;

     document.getElementById('weather').style.display = "block";
     document.getElementById('loader').style.display = "none";
}

async function main() {
     let day = new Date().getDay();
     setWeather("", 'celsius', 'kmh', 'mm', day);

     let form = document.querySelector('.searchForm');
     let searchInput = document.getElementById('searchInput');
     let suggestionUl = document.getElementById('searchSuggestion');
     let timeout = null;

     searchInput.addEventListener('input', async (e) => {
          clearTimeout(timeout);

          timeout = setTimeout(async () => {
               const query = searchInput.value;

               if (query.length < 2) {
                    suggestionUl.innerHTML = "";
                    return;
               }

               const url = `https://geocoding-api.open-meteo.com/v1/search?name=${query}&count=5&language=en&format=json`;
               const res = await fetch(url);
               const data = await res.json();

               suggestionUl.innerHTML = "";

               if (data.results) {
                    data.results.forEach(place => {
                         let li = document.createElement('li');

                         li.textContent = `${place.name}, ${place.country}`;

                         li.addEventListener('click', () => {
                              searchInput.value = place.name;
                              suggestionUl.innerHTML = "";
                         });

                         suggestionUl.appendChild(li);
                    })
               } else {
                    let li = document.createElement('li');
                    li.innerHTML = `<img class="searchLoader" src="/assets/images/icon-loading.svg" alt="loading..."> Search in progress`;
                    suggestionUl.appendChild(li);
               }
          }, 300);
     })

     form.addEventListener('submit', async (event) => {
          event.preventDefault();
          await setWeather(searchInput.value, 'celsius', 'kmh', 'mm', day);
          suggestionUl.innerHTML = "";
     });

     let getLocationName = () => {
          return searchInput.value;
     }

     let celsiusLi = document.getElementById('celsius');
     let fahrenheitLi = document.getElementById('fahrenheit');
     let kmhLi = document.getElementById('kmh');
     let mphLi = document.getElementById('mph');
     let mmLi = document.getElementById('mm');
     let inchLi = document.getElementById('inch');

     celsiusLi.addEventListener('click', (e) => {
          let placeName = getLocationName();
          setWeather(placeName, 'celsius', 'kmh', 'mm', day);
          celsiusLi.classList.toggle('active');
          fahrenheitLi.classList.toggle('active');
     })
     fahrenheitLi.addEventListener('click', (e) => {
          let placeName = getLocationName();
          setWeather(placeName, 'fahrenheit', 'kmh', 'mm', day);
          fahrenheitLi.classList.toggle('active');
          celsiusLi.classList.toggle('active');
     })
     kmhLi.addEventListener('click', (e) => {
          let placeName = getLocationName();
          setWeather(placeName, 'celsius', 'kmh', 'mm', day);
          kmhLi.classList.toggle('active');
          mphLi.classList.toggle('active');
     })
     mphLi.addEventListener('click', (e) => {
          let placeName = getLocationName();
          setWeather(placeName, 'celsius', 'mph', 'mm', day);
          mphLi.classList.toggle('active');
          kmhLi.classList.toggle('active');
     })
     mmLi.addEventListener('click', (e) => {
          let placeName = getLocationName();
          setWeather(placeName, 'celsius', 'kmh', 'mm', day);
          mmLi.classList.toggle('active');
          inchLi.classList.toggle('active');
     })
     inchLi.addEventListener('click', (e) => {
          let placeName = getLocationName();
          setWeather(placeName, 'celsius', 'kmh', 'inch', day);
          inchLi.classList.toggle('active');
          mmLi.classList.toggle('active');
     })

     document.querySelector('.retryBtn').addEventListener('click', () => {
          location.reload();
     });


     document.querySelector('.drop_down_days').addEventListener('mouseover', e => {
          document.getElementById('hourly-forecast-ul-days').classList.add('showUl');
     });

     document.querySelectorAll('#hourly-forecast-ul-days > li').forEach(e => {
          e.addEventListener('click', (dayClicked) => {
               let day = dayClicked.target.dataset.day;
               let index = dayNames.findIndex(d => d.toLowerCase() === day)
               let label = labels[index];
               document.querySelector('.daySelected').textContent = day;

               addHourlyDataToList(label);

               document.getElementById('hourly-forecast-ul-days').classList.remove('showUl');
          })
     });
}

main()