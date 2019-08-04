import find from 'lodash/find';
import groupBy from 'lodash/groupBy';
import map from 'lodash/map';
import memoizeOne from 'memoize-one';
import React, { Fragment } from 'react';
import { connect } from 'react-redux';
import { Country } from 'src/constants/countries';
import { ContractState, IContract } from 'src/models/contract';
import { ISchool } from 'src/models/school';
import { loadContracts } from 'src/state/contract/action';
import { IContractState } from 'src/state/contract/reducer';
import { loadISPs } from 'src/state/isp/action';
import { IState } from 'src/state/rootReducer';
import { loadSchools } from 'src/state/school/action';
import { ISchoolState } from 'src/state/school/reducer';
import './style.scss';
import { Collapsible } from 'src/components/layout/Collapsible';
import { translate } from 'src/i18n';
import classnames from 'classnames';

// #region -------------- Interfaces --------------------------------------------------------------

interface IConnectivityTree {
  countries: ICountryConnectivity[];
}

interface ICountryConnectivity {
  code: Country;
  connectivityScore?: number;
  schools: ISchoolConnectivity[];
}

interface ISchoolConnectivity {
  data: ISchool;
  connectivityScore?: number;
  contract?: IContract;
}

interface IStateProps {
  tree: IConnectivityTree;
}

interface IDispatchProps {
  loadTree();
}

interface IProps extends IStateProps, IDispatchProps {
}

// #endregion

// #region -------------- Component ---------------------------------------------------------------

class ConnectivityExplorer extends React.Component<IProps> {
  public constructor(props) {
    super(props);
  }

  public componentDidMount() {
    this.props.loadTree();
  }

  public render() {
    return (
      <div className='mh-connectivity-explorer'>
        {this.renderCountries()}
      </div>
    );
  }

  private renderCountries() {
    const { tree } = this.props;

    if (!tree) {
      return null;
    }

    return tree.countries.map(country => {
      return (
        <Fragment key={country.code}>
          {this.renderCountry(country)}
        </Fragment>
      );
    });
  }

  private renderCountry(country: ICountryConnectivity) {
    return (
      <Collapsible
        header={this.renderHeader(translate(t => t.countries[country.code]), country.connectivityScore)}
      >
        {country.schools.map(s => (
          <Fragment key={s.data.address}>
            {this.renderSchool(s)}
          </Fragment>
        ))}
      </Collapsible>
    );
  }

  private renderSchool(school: ISchoolConnectivity) {
    return (
      <Collapsible
        header={this.renderHeader(school.data.name, school.connectivityScore)}
      >
        {JSON.stringify(school.data)}
      </Collapsible>
    );
  }

  private renderContract(contract: IContract) {
  }

  private renderHeader(text: string, indicatorScore: number) {
    let colorClass = 'mh-green';

    if (!indicatorScore || indicatorScore < 0.33) {
      colorClass = 'mh-red';
    } else if (indicatorScore < 0.77) {
      colorClass = 'mh-yellow';
    }

    return (
      <div className='mh-tree-item-header'>
        <div className='mh-header-text'>{text}</div>
        <div className={classnames('mh-status-indicator', colorClass)}></div>
      </div>
    );
  }
}

// #endregion

// #region -------------- Connect -------------------------------------------------------------------

const connected = connect<IStateProps, IDispatchProps, any, IState>(
  (state) => {
    const { school, contract } = state;

    return {
      tree: createTree(school, contract),
    };
  },
  (dispatch) => {
    return {
      loadTree: () => {
        dispatch(loadSchools.init());
        dispatch(loadISPs.init());
        dispatch(loadContracts.init());
      },
    };
  },
)(ConnectivityExplorer);

export { connected as ConnectivityExplorer };

// #endregion

// #region -------------- Tree structure creation -------------------------------------------------------------------

const createTree = memoizeOne((schoolState: ISchoolState, contractState: IContractState): IConnectivityTree => {
  const allSchools = map(schoolState.loaded, s => s.data).filter(s => s);
  const schoolsByCountries = groupBy(allSchools, (value) => value && value.country);

  const tree: IConnectivityTree = {
    countries: [],
  };

  for (const country in schoolsByCountries) {
    if (!schoolsByCountries.hasOwnProperty(country)) {
      continue;
    }

    let countryScoreSum = 0;
    const schoolsConnectivity: ISchoolConnectivity[] = [];
    const schools = schoolsByCountries[country];

    schools.forEach(school => {

      // Find active contract for school
      const contract = find(contractState.loaded, c =>
        c.data && c.data.state === ContractState.Active && c.data.schoolAddress === school.address);

      const schoolConnectivity: ISchoolConnectivity = {
        connectivityScore: contract && contract.data.connectivityScore,
        contract: contract && contract.data,
        data: school,
      };

      if (schoolConnectivity.connectivityScore) {
        countryScoreSum += schoolConnectivity.connectivityScore;
      }

      schoolsConnectivity.push(schoolConnectivity);
    });

    tree.countries.push({
      code: country as Country,
      connectivityScore: countryScoreSum / schools.length,
      schools: schoolsConnectivity,
    });
  }

  return tree;
});

// #endregion
