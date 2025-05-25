import React, { useMemo } from 'react';

// react bootstrap
import { Row, Col, Card } from 'react-bootstrap';

// third party
import DataTable from 'react-data-table-component';

// project imports
import { makeData, sortingColumns } from '../../data/reactTableData';

const totaldata = 10;

// -----------------------|| SORTING TABLE ||-----------------------//

const SortingTable = () => {
  const data = useMemo(() => makeData(totaldata), []);
  return (
    <>
      <Row noGutters>
        <Col sm={12}>
          <Card>
            <Card.Header>
              <h5>Sorting</h5>
              <small>
                Adding <code>sortable: true</code> a table
              </small>
            </Card.Header>
            <Card.Body>
              <DataTable columns={sortingColumns} data={data} />
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default SortingTable;
