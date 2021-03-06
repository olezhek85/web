import { put, select, takeLatest } from 'redux-saga/effects';
import update from 'immutability-helper';
import steemConnectAPI from 'utils/steemConnectAPI';
import { getPostKey } from '../utils';
import { selectMe } from 'features/User/selectors';
import { notification } from 'antd';
import { extractErrorMessage } from 'utils/errorMessage';

/*--------- CONSTANTS ---------*/
const RESTEEM_BEGIN = 'RESTEEM_BEGIN';
const RESTEEM_SUCCESS = 'RESTEEM_SUCCESS';
const RESTEEM_FAILURE = 'RESTEEM_FAILURE';

/*--------- ACTIONS ---------*/
export function resteemBegin(post) {
  return { type: RESTEEM_BEGIN, post };
}

export function resteemSuccess(me, post) {
  return { type: RESTEEM_SUCCESS, me, post };
}

export function resteemFailure(post, message) {
  return { type: RESTEEM_FAILURE, post, message };
}

/*--------- REDUCER ---------*/
export function resteemReducer(state, action) {
  switch (action.type) {
    case RESTEEM_BEGIN: {
      return update(state, {
        posts: {
          [getPostKey(action.post)]: {
            isResteeming: {$set: true},
          }
        }
      });
    }
    case RESTEEM_SUCCESS: {
      return update(state, {
        posts: {
          [getPostKey(action.post)]: {
            isResteeming: { $set: false },
          }
        },
      });
    }
    case RESTEEM_FAILURE: {
      return update(state, {
        posts: {
          [getPostKey(action.post)]: {
            isResteeming: {$set: false},
          }
        }
      });
    }
    default:
      return state;
  }
}

/*--------- SAGAS ---------*/
function* resteem({ post }) {
  try {
    const me = yield select(selectMe());
    yield steemConnectAPI.reblog(me, post.author, post.permlink);
    yield put(resteemSuccess(me, post));
    yield notification['success']({ message: 'Content was successfully resteemed.' });
  } catch (e) {
    yield notification['error']({ message: extractErrorMessage(e) });
    yield put(resteemFailure(post, e.message));
  }
}

export default function* resteemManager() {
  yield takeLatest(RESTEEM_BEGIN, resteem);
}
