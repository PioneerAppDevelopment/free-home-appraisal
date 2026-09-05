import React from 'react';
import HouseCard from '../components/HouseCard';
import Grid from '@mui/material/Grid';
import FHAEstimate from "../components/FHAEstimate";
import EstimateContainer from "../containers/EstimateContainer";
import Container from '@mui/material/Container';
import PDFButton from '../components/PDFButton';
import Button from '@mui/material/Button';

export default function APIContainer(props) {
    

    return (
        <Container maxWidth="lg">
            <div className="back-to-search-wrap">
                <Button
                    className="back-to-search-button"
                    variant="contained"
                    color="primary"
                    href="/"
                    onClick={props.onResetSearch}
                >
                    Back to Search
                </Button>
            </div>
            <Grid container direction="row" justifyContent="center" alignItems="center" id="print-area">
                <HouseCard home={props.home} extraHomeData={props.extraHomeData} />
                <EstimateContainer
                    estimates={props.estimates}
                    sourceStatuses={props.sourceStatuses}
                />
                <FHAEstimate estimates={props.estimates} />
                <PDFButton savePage={props.savePage}/>
            </Grid>
        </Container>
    )
}
