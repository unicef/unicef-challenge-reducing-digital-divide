import { getActionNameCreator } from 'src/core/redux/action';
import { createAsyncAction } from 'src/core/redux/asyncAction';
import { ISchool } from 'src/models/school';
import { Address } from 'verifiable-data';

// #region -------------- Action types -------------------------------------------------------------------

const get = getActionNameCreator('school');

export const actionTypes = {
  loadSchools: get('LOAD_ALL'),
  loadSchool: get('LOAD'),
  createSchool: get('CREATE'),
};

// #endregion

// #region -------------- School loading -------------------------------------------------------------------

export const loadSchools = createAsyncAction<void, void>(actionTypes.loadSchools);

export interface ICreateSchoolPayload {
  name: string;
  physicalAddress: string;
  country: string;
  score: number;
}

export const createSchool = createAsyncAction<ICreateSchoolPayload, void>(actionTypes.createSchool);

export const loadSchool = createAsyncAction<Address, ISchool>(actionTypes.loadSchool);

// #endregion
