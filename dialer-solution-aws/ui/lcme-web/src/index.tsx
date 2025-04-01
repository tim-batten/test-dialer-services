import '@aws-amplify/ui-react/styles.css';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { AppWrapper } from './components/AppWrapper/AppWrapper.component';
import './index.css';
import { persistor, store } from './redux/store';
import reportWebVitals from './reportWebVitals';
import { PersistGate } from 'redux-persist/integration/react';

ReactDOM.render(
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <AppWrapper />
    </PersistGate>
  </Provider>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
