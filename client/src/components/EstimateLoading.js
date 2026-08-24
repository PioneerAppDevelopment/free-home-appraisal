import React from 'react';
import LoadingIcon from '../assets/img/loading-icon.png';
import { ESTIMATE_SOURCE_CONFIGS } from '../utils/estimateSources';
import './EstimateLoading.css';

export default function EstimateLoading() {
  return (
    <div className="loading-screen estimate-loading" role="status" aria-live="polite">
      <div className="estimate-loading-card">
        <div className="estimate-loading-icon-wrap">
          <img src={LoadingIcon} alt="" />
          <div className="estimate-loading-spinner" aria-hidden="true" />
        </div>
        <h1>Fetching your YouPraisal estimate</h1>
        <p>Checking available valuation sources for this property.</p>
        <div className="estimate-loading-sources" aria-label="Sources being checked">
          {ESTIMATE_SOURCE_CONFIGS.map(source => (
            <span key={source.providerKey}>{source.name}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
