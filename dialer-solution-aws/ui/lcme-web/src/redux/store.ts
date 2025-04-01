import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // defaults to localStorage for web
import loginReducer from './slices/loginSlice';
import navigationReducer from './slices/navigationSlice';
import schedule from './reducers/SchedulerReducer';
import campaign from './reducers/CampaignReducer';
import campaignOversight from './reducers/CampaignOversightReducer';
import contactList from './reducers/ContactListReducer';
import config from './reducers/ConfigReducer';
import promise from 'redux-promise-middleware';
import global from './reducers/GlobalReducer';
import filter from './reducers/FilterReducer';
import rolesAccess from "./reducers/RolesAccessReducer";
import { apiStatusReducer } from './reducers/ApiStatusReducer';

const reducers = combineReducers({
  apiStatus: apiStatusReducer,
  login: loginReducer,
  navigation: navigationReducer,
  schedule: schedule,
  campaign: campaign,
  campaignOversight: campaignOversight,
  contactList: contactList,
  config: config,
  global: global,
  filter: filter,
  rolesAccess: rolesAccess,
});

const persistConfig = {
  key: 'root',
  storage,
};
const rootReducer = (state: any, action: any) => {
  if (action.type === 'RESET_STORE') {
    state = undefined;
    localStorage.removeItem('persist:root');
  }
  return reducers(state, action);
}
const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: [promise],
});
export const persistor = persistStore(store);

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
