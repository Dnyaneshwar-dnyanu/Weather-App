async function getLongLat(placeName) {
     const urlToLongLat = `https://geocoding-api.open-meteo.com/v1/search?name=${placeName}&count=1&language=en&format=json`;


     let res = await fetch(urlToLongLat);
     let data = await res.json();

     let latitude = data.results[0].latitude;
     let longitude = data.results[0].longitude;
     let country = data.results[0].country;

     return { longitude, latitude, country };
}

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
                         (error) => reject(error.message())
                    );
               });

               const urlToPlaceName = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.latitude}&lon=${location.longitude}&zoom=18&addressdetails=1`;

               let response = await fetch(urlToPlaceName, {
                    headers: {
                         "User-Agent": "MyWeatherApp/1.0 (dnyanu0506@gmail.com)"
                    }
               });
               locationDetails = await response.json();
          }

          const urlToWeatherData = `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&daily=temperature_2m_max,temperature_2m_min,weather_code&hourly=temperature_2m,wind_speed_10m,relative_humidity_2m,apparent_temperature,precipitation,weather_code&current=is_day,weather_code&timezone=GMT&wind_speed_unit=${windUnit}&temperature_unit=${tempUnit}&precipitation_unit=${precipitationUnit}`;

          let res = await fetch(urlToWeatherData);
          let data = await res.json();

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
          let hourly = data.hourly;
          let current = data.current;

          let locationName = placeName.length > 0 ? placeName + ', ' + location.country : locationDetails.address.county + ', ' + locationDetails.address.country;
          let dateNow = today.toString().slice(0, 15);

          document.querySelector('.status').style.display = "none";
          document.querySelector('.weather-container').style.display = "flex";
          return { locationName, dateNow, tempNow, windSpeed, humidity, feelsLike, precipitation, hourly, daily, current, units };
     }
     catch {
          document.querySelector('.status').style.display = "inline-block";
          document.querySelector('.weather-container').style.display = "none";
          document.getElementById('weather').style.display = "block";
          document.getElementById('loader').style.display = "none";
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


async function setWeather(placeName, tempUnit, windUnit, precipitationUnit) {
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
     let dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
     weatherData.daily.time.forEach((day, index) => {
          let today = dayNames[(new Date(day)).getDay()];

          daysHTML += `<div class="forecast-desc-box">
                                   <h4 class="day">${today}</h4>
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

     for (let i = startHour; i < startHour + 12; i++) {
          let time = parseInt(weatherData.hourly.time[i].slice(11, 13), 10);
          time = time > 12 ? time - 12 : time;
          if (time == 0) { time = 12; }

          let temp = parseInt(weatherData.hourly.temperature_2m[i], 10);
          hourlyHTML += `<li><span class="hourly-forecast-icons"><img src="/images/${getWeatherIcon(weatherData.hourly.weather_code[i], weatherData.current.is_day)}" alt="">${time} ${ampm}</span><span>${temp}&deg;</span></li>`
     }

     hourlyForecast.innerHTML = hourlyHTML;

     document.getElementById('weather').style.display = "block";
     document.getElementById('loader').style.display = "none";
}

async function main() {
     setWeather("", 'celsius', 'kmh', 'mm');

     let form = document.querySelector('.searchForm');
     let searchInput = document.getElementById('searchInput');

     form.addEventListener('submit', async (event) => {
          event.preventDefault();
          await setWeather(searchInput.value, 'celsius', 'kmh', 'mm');
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
          setWeather(placeName, 'celsius', 'kmh', 'mm');
          celsiusLi.classList.toggle('active');
          fahrenheitLi.classList.toggle('active');
     })
     fahrenheitLi.addEventListener('click', (e) => {
          let placeName = getLocationName();
          setWeather(placeName, 'fahrenheit', 'kmh', 'mm');
          fahrenheitLi.classList.toggle('active');
          celsiusLi.classList.toggle('active');
     })
     kmhLi.addEventListener('click', (e) => {
          let placeName = getLocationName();
          setWeather(placeName, 'celsius', 'kmh', 'mm');
          kmhLi.classList.toggle('active');
          mphLi.classList.toggle('active');
     })
     mphLi.addEventListener('click', (e) => {
          let placeName = getLocationName();
          setWeather(placeName, 'celsius', 'mph', 'mm');
          mphLi.classList.toggle('active');
          kmhLi.classList.toggle('active');
     })
     mmLi.addEventListener('click', (e) => {
          let placeName = getLocationName();
          setWeather(placeName, 'celsius', 'kmh', 'mm');
          mmLi.classList.toggle('active');
          inchLi.classList.toggle('active');
     })
     inchLi.addEventListener('click', (e) => {
          let placeName = getLocationName();
          setWeather(placeName, 'celsius', 'kmh', 'inch');
          inchLi.classList.toggle('active');
          mmLi.classList.toggle('active');
     })

     document.querySelector('.retryBtn').addEventListener('click', () => {
          location.reload();
     });

     document.getElementById('hourly-forecast-ul-days').addEventListener('click', () => {
          
     })

}

main()