import React, { useState, useEffect } from 'react';
import type { Node } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  Button,
  FlatList,
} from 'react-native';

import {
  Colors,
} from 'react-native/Libraries/NewAppScreen';

import { API, graphqlOperation } from 'aws-amplify';
import { createImage } from './graphql/mutations';
import { listImages } from './graphql/queries';
import { withAuthenticator } from 'aws-amplify-react-native';

const Section = ({ children, title }): Node => {
  const isDarkMode = useColorScheme() === 'dark';
  return (
    <View style={styles.sectionContainer}>
      <Text
        style={[
          styles.sectionTitle,
          {
            color: isDarkMode ? Colors.white : Colors.black,
          },
        ]}>
        {title}
      </Text>
      <Text
        style={[
          styles.sectionDescription,
          {
            color: isDarkMode ? Colors.light : Colors.dark,
          },
        ]}>
        {children}
      </Text>
    </View>
  );
};

const App: () => Node = () => {
  const isDarkMode = useColorScheme() === 'dark';
  const [images, setImages] = useState([]);

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  useEffect(() => {
    fetchImages();
  }, [])

  async function fetchImages() {
    try {
      const imageData = await API.graphql(graphqlOperation(listImages));
      const images = imageData.data.listImages.items;
      setImages(images);
    } catch (err) { console.log('error fetching images') }
  }

  async function addImage() {
    try {
      const key = (new Date()).toISOString();
      const image = { key: key, labels: ['cat', 'animal'] };
      setImages([...images, image]);
      await API.graphql(graphqlOperation(createImage, { input: image }));
    } catch (err) {
      console.log('error creating image:', err)
    }
  }

  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <Button title="Create Image" onPress={addImage} />
      <FlatList
        data={images}
        contentInsetAdjustmentBehavior="automatic"
        style={backgroundStyle}
        renderItem={({ item, index }) => (
          <View key={item.id ? item.id : index} style={{
            backgroundColor: isDarkMode ? Colors.black : Colors.white,
          }} >
            <Section title={item.key}>
              {item.labels.map((label, index) => (
                <Text key={index}>{label}, </Text>
              ))
              }
            </Section>
          </View>
        )}
      >
      </FlatList>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
  },
  highlight: {
    fontWeight: '700',
  },
});

export default withAuthenticator(App);
