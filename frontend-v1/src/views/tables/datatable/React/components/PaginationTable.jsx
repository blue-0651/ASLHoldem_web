import React, { useMemo } from 'react';

// react bootstrap
import { Row, Col, Card } from 'react-bootstrap';

// third party
import DataTable from 'react-data-table-component';

// project imports
import { makeData, generalColumns } from '../../data/reactTableData';

const totaldata = 25;

// -----------------------|| PAGINATION TABLE ||-----------------------//

const PaginationTable = () => {
  const data = useMemo(() => makeData(totaldata), []);
  return (
    <>
      <Row noGutters>
        <Col sm={12}>
          <Card>
            <Card.Header>
              <h5>Pagination</h5>
              <small>Creating a React Data Table should be easy. Simply define your columns and data arrays</small>
            </Card.Header>
            <Card.Body>
              <DataTable columns={generalColumns} data={data} pagination />
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default PaginationTable;
