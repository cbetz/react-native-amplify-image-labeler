import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  Button,
  FlatList,
  TouchableOpacity,
} from 'react-native';

import { RNCamera } from 'react-native-camera';
import { Appbar, Card, Paragraph } from 'react-native-paper';

import {
  Colors,
} from 'react-native/Libraries/NewAppScreen';

import { API, graphqlOperation, Storage, Predictions, Auth } from 'aws-amplify';
import { createImage } from './graphql/mutations';
import { listImages } from './graphql/queries';
import { withAuthenticator, S3Image } from 'aws-amplify-react-native';

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

const App = () => {
  const isDarkMode = useColorScheme() === 'dark';
  const [images, setImages] = useState([]);
  const [showCamera, setShowCamera] = useState(false)

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
    flex: 1,
  };

  useEffect(() => {
    fetchImages();
  }, [])

  function onShowCameraPressed() {
    setShowCamera(true);
  }

  takePicture = async () => {
    if (this.camera) {
      const options = { quality: 0.5, base64: true };
      const photo = await this.camera.takePictureAsync(options);

      const response = await fetch(photo.uri);
      const blob = await response.blob();

      const key = photo.uri.split("/").pop();

      Storage.put(key, blob, { level: 'private' })
        .then(result => {
          Predictions.identify({
            labels: {
              source: {
                key: key,
                level: 'private'
              },
              type: "ALL"
            }
          }).then(result => {
            const { labels } = result;
            const labelNames = labels.map(l => l.name);

            addImage(key, labelNames);
            setShowCamera(false);
          }).catch(err => {
            console.log('error: ', err);
          });
        })
        .catch(err => {
          console.log(err);
        });
    }
  };

  async function onSignOutPressed() {
    try {
      await Auth.signOut();
    } catch (error) {
      console.log('error signing out: ', error);
    }
  }

  async function fetchImages() {
    try {
      const imageData = await API.graphql(graphqlOperation(listImages));
      const images = imageData.data.listImages.items;
      setImages(images);
    } catch (err) { console.log('error fetching images'); }
  }

  async function addImage(key, labels) {
    try {
      const image = { key: key, labels: labels };
      setImages([...images, image]);
      await API.graphql(graphqlOperation(createImage, { input: image }));
    } catch (err) {
      console.log('error creating image:', err);
    }
  }

  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        <RNCamera
          ref={ref => {
            this.camera = ref;
          }}
          style={styles.preview}
          type={RNCamera.Constants.Type.back}
          androidCameraPermissionOptions={{
            title: 'Permission to use camera',
            message: 'We need your permission to use your camera to label images',
            buttonPositive: 'OK',
            buttonNegative: 'Cancel',
          }}
        />
        <View style={{ flex: 0, flexDirection: 'row', justifyContent: 'center' }}>
          <TouchableOpacity onPress={this.takePicture.bind(this)} style={styles.capture}>
            <Text style={{ fontSize: 14 }}> Label Image </Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  } else {
    return (
      <>
        <Appbar.Header>
          <Appbar.Content title="Amplify Image Labeler" />
          <Appbar.Action icon="camera" onPress={onShowCameraPressed} />
          <Appbar.Action icon="logout" onPress={onSignOutPressed} />
        </Appbar.Header>
        <SafeAreaView style={backgroundStyle}>

          <FlatList
            data={images}
            contentInsetAdjustmentBehavior="automatic"
            style={backgroundStyle}
            renderItem={({ item, index }) => (
              <Card key={item.id ? item.id : index} style={styles.card} >
                <View style={styles.imageContainer}>
                  <S3Image level="private" imgKey={item.key} style={styles.image} />
                </View>
                <Card.Title title="Labels" />
                <Card.Content>
                  {item.labels.map((label, index) => (
                    <Paragraph key={index}>{label}</Paragraph>
                  ))
                  }
                </Card.Content>
              </Card>
            )}
          >
          </FlatList>

        </SafeAreaView>
      </>
    );
  }
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
  cameraContainer: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: 'black',
  },
  preview: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  capture: {
    flex: 0,
    backgroundColor: '#fff',
    borderRadius: 5,
    padding: 15,
    paddingHorizontal: 20,
    alignSelf: 'center',
    margin: 20,
  },
  imageContainer: {
    height: 195,
    overflow: 'hidden',
  },
  image: {
    flex: 1,
    padding: 16,
    justifyContent: 'flex-end',
    resizeMode: 'cover',
  },
  card: {
    margin: 4,
  },
});

export default withAuthenticator(App);
