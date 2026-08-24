import React from 'react';
import EstimateCard from '../components/EstimateCard';
import Grid from "@mui/material/Grid";
import { ESTIMATE_SOURCE_CONFIGS } from '../utils/estimateSources';

// function renderEstimateCards(props) {
//     return props.estimates.map(estimate => {
//         return <EstimateCard key={estimate.id} data={estimate} toggleEstimate={props.toggleEstimate} />
//     })
// }

export default function EstimateContainer(props) {
    const sourceStatuses = props.sourceStatuses && props.sourceStatuses.length
        ? props.sourceStatuses
        : ESTIMATE_SOURCE_CONFIGS.map(source => ({ ...source, status: 'Checked' }));

    const statusByEstimateKey = sourceStatuses.reduce((statuses, source) => {
        statuses[source.estimateKey] = source.status;
        return statuses;
    }, {});

    const estimateCards = Object.entries(props.estimates)
        .map(([estimateKey, estimate]) => ({
            ...estimate,
            sourceStatus: statusByEstimateKey[estimateKey] || 'Checked'
        }))
        .filter(estimate => estimate.visible !== false)
        .map(estimate => (
            <EstimateCard
                key={estimate.id}
                data={estimate}
                toggleEstimate={props.toggleEstimate}
            />
        ));

    return (
        <div className="estimate-results-panel">
        <h1>SOURCES CHECKED</h1>
        <p className="estimate-results-summary">
            We checked {estimateCards.length} valuation sources for this property.
        </p>
        <Grid container direction="row" justifyContent="center" alignItems="stretch" spacing={2}>
            {estimateCards}
          </Grid>
        </div>
    )
}
