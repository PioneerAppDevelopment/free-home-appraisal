import React from 'react';
import Button from '@mui/material/Button';

export default function PDFButton(props) {
    return (
        <div className="download-section">
            <Button 
                onClick={props.savePage}
                variant="contained"
                color="primary"
                size="large"
                className="download-button">
                <span role="img" aria-label="save">💾</span> &nbsp; Download PDF
            </Button>
        </div>
    )
}
