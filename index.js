/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import Amplify from 'aws-amplify';
import Predictions, { AmazonAIPredictionsProvider } from '@aws-amplify/predictions'
import config from './aws-exports';

Amplify.configure({
    ...config,
    Analytics: {
        disabled: true,
    },
});
Amplify.addPluggable(new AmazonAIPredictionsProvider());

AppRegistry.registerComponent(appName, () => App);
