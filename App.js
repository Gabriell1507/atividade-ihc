import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, Image, ScrollView, StyleSheet, ImageBackground, Keyboard, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { format, parseISO } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { API_KEY } from '@env';



const App = () => {
  const [searchCity, setSearchCity] = useState('');
  const [city, setCity] = useState('');
  const [weatherData, setWeatherData] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getLocation();
  }, []);

  const getLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Permissão para acessar a localização foi negada.');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      getCityName(latitude, longitude);
    } catch (error) {
      console.error('Error fetching location:', error);
      setError('Erro ao obter a localização. Por favor, verifique as configurações de localização do dispositivo.');
    }
  };

  const getCityName = async (latitude, longitude) => {
    try {
      const response = await fetch(`http://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${latitude},${longitude}`);
      const data = await response.json();
      if (response.ok) {
        setCity(data.location.name);
        setSearchCity(data.location.name); 
      } else {
        setError(data.error.message);
      }
    } catch (error) {
      console.error('Error fetching city name:', error);
      setError('Erro ao obter o nome da cidade. Por favor, tente novamente.');
    }
  };

  useEffect(() => {
    if (city) {
      fetchWeather();
      fetchForecast();
    }
  }, [city]);

  const fetchWeather = async () => {
    try {
      const response = await fetch(`http://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${city}`);
      const data = await response.json();
      if (response.ok) {
        setWeatherData(data);
        setError(null);
      } else {
        setError(data.error.message);
      }
    } catch (error) {
      console.error('Error fetching weather:', error);
      setError('Erro ao buscar dados do clima. Por favor, tente novamente.');
    }
  };

  const fetchForecast = async () => {
    try {
      const response = await fetch(`http://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${city}&days=3`);
      const data = await response.json();
      if (response.ok) {
        setForecastData(data.forecast.forecastday);
        setError(null);
      } else {
        setError(data.error.message);
      }
    } catch (error) {
      console.error('Error fetching forecast:', error);
      setError('Erro ao buscar previsão do tempo. Por favor, tente novamente.');
    }
  };

  const handleSearch = () => {
    Keyboard.dismiss(); 
    setCity(searchCity); 
    fetchWeather();
    fetchForecast();
  };

  const renderItem = ({ item }) => (
    <View style={styles.forecastItem}>
      <Text style={styles.forecastDate}>{format(parseISO(item.date), "EEEE, dd/MM/yyyy", { locale: ptBR }).replace(/^\w/, (c) => c.toUpperCase())}</Text>
      <Image source={{ uri: 'http:' + item.day.condition.icon }} style={styles.weatherIcon} />
      <Text>Temperatura: {item.day.avgtemp_c}°C</Text>
      <Text>Umidade: {item.day.avghumidity}%</Text>
      <Text>Vento: {item.day.maxwind_kph} km/h</Text>
      <Text>Previsão de chuva: {item.day.daily_chance_of_rain}%</Text>
    </View>
  );

  return (
    <ImageBackground source={require('./assets/bg.jpg')} style={styles.backgroundImage}>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <View style={styles.innerContainer}>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.input}
                onChangeText={text => setSearchCity(text)}
                value={searchCity}
                placeholder="Digite o nome da cidade"
                placeholderTextColor="black"
                onSubmitEditing={handleSearch}
              />
              <Ionicons name="search" size={24} color="black" style={styles.searchIcon} />
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
            {weatherData && (
              <View style={styles.weatherInfo}>
                <Text style={styles.cityName}>{weatherData.location.name}, {weatherData.location.country}</Text>
                <Text style={styles.weatherDetail}>Temperatura: {weatherData.current.temp_c}°C</Text>
                <Image source={{ uri: 'http:' + weatherData.current.condition.icon }} style={styles.weatherIcon} />
                <Text style={styles.weatherDetail}>Umidade: {weatherData.current.humidity}%</Text>
                <Text style={styles.weatherDetail}>Vento: {weatherData.current.wind_kph} km/h</Text>
                <Text style={styles.weatherDetail}>Previsão de chuva: {weatherData.current.precip_mm}mm</Text>
              </View>
            )}
            {forecastData && (
              <View style={styles.forecastContainer}>
                <Text style={styles.forecastTitle}>Próximas Previsões:</Text>
                <FlatList
                  data={forecastData}
                  renderItem={renderItem}
                  keyExtractor={item => item.date}
                  horizontal
                />
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  innerContainer: {
    padding: 20,
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 5,
    paddingHorizontal: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 40,
    color: 'black',
  },
  errorText: {
    color: 'red',
    marginTop: 10,
  },
  weatherInfo: {
    marginTop: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    width: '100%',
  },
  cityName: {
    fontWeight: 'bold',
    marginBottom: 5,
    color: 'black',
  },
  weatherDetail: {
    marginBottom: 5,
    color: 'black',
  },
  weatherIcon: {
    width: 80,
    height: 80,
    marginBottom: 5,
  },
  forecastContainer: {
    marginTop: 20,
    alignItems: 'center',
    width: '100%',
  },
  forecastTitle: {
    fontWeight: 'bold',
    marginBottom: 10,
    color: 'black',
  },
  forecastItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    padding: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  forecastDate: {
    fontWeight: 'bold',
    marginBottom: 5,
    color: 'black',
  },
  backgroundImage: {
    flex: 1,
    resizeMode: 'cover',
    justifyContent: 'center',
  },
});

export default App;
