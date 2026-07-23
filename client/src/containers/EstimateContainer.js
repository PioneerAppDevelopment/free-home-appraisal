import React from 'react';
import EstimateCard from '../components/EstimateCard';
import Grid from "@mui/material/Grid";

// function renderEstimateCards(props) {
//     return props.estimates.map(estimate => {
//         return <EstimateCard key={estimate.id} data={estimate} toggleEstimate={props.toggleEstimate} />
//     })
// }

export default function EstimateContainer(props) {
    const estimateCards = Object.values(props.estimates)
        .filter(estimate => estimate.visible !== false)
        .map(estimate => (
            <EstimateCard
                key={estimate.id}
                data={estimate}
                toggleEstimate={props.toggleEstimate}
            />
        ));

    return (
        <div>
        <h1>ESTIMATES</h1>
        <Grid container direction="row" justify="center" alignItems="center">
            {estimateCards}
          </Grid>
        </div>
    )
}
