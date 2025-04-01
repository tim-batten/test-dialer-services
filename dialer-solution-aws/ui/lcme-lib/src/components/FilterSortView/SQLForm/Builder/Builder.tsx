import React, { useState } from 'react';
import { Query, Builder, Utils as QbUtils } from 'react-awesome-query-builder';
import {
  JsonGroup,
  Config,
  ImmutableTree,
  BuilderProps,
  BasicConfig,
} from 'react-awesome-query-builder';
import AntdConfig from 'react-awesome-query-builder/lib/config/antd';
import AntdWidgets from 'react-awesome-query-builder/lib/components/widgets/antd';
import 'antd/dist/antd.css';
import 'react-awesome-query-builder/lib/css/styles.css';
import 'react-awesome-query-builder/lib/css/compact_styles.css';
import { Wrapper } from './Builder.Styles';

interface IBuilder {}

const { FieldSelect, FieldDropdown, FieldCascader, FieldTreeSelect } =
  AntdWidgets;

const initialConfig = AntdConfig;

const config: Config = {
  ...initialConfig,
  fields: {
    FirstName: {
      label: 'First Name',
      type: 'text',
    },
    LastName: {
      label: 'Last Name',
      type: 'text',
    },
  },
};
const queryValue: JsonGroup = { id: QbUtils.uuid(), type: 'group' };

export const BuilderSQL: React.FunctionComponent<IBuilder> = () => {
  const [buildState, setBuildState] = useState({
    tree: QbUtils.checkTree(QbUtils.loadTree(queryValue), config),
    config: config,
  });

  const onChange = (immutableTree: ImmutableTree, config: Config) => {
    setBuildState({ tree: immutableTree, config: config });
    const jsonTree = QbUtils.getTree(immutableTree);
  };

  const renderBuilder = (props: BuilderProps) => (
    <div className='query-builder-container' style={{ padding: '10px' }}>
      <div className='query-builder qb-lite'>
        <Builder {...props} />
      </div>
    </div>
  );

  return (
    <div>
      <Query
        {...config}
        value={buildState.tree}
        onChange={onChange}
        renderBuilder={renderBuilder}
      />
      <div className='query-builder-result'>
        SQL result:{' '}
        <pre>
          {JSON.stringify(
            QbUtils.sqlFormat(buildState.tree, buildState.config),
          )}
        </pre>
      </div>
    </div>
  );
};

Builder.defaultProps = {};
