import React from 'react';

// react-bootstrap
import { Row, Col, Card, Table } from 'react-bootstrap';

// project imports
import { TableData } from 'data/tableData';

// -----------------------|| SIZING TABLE ||-----------------------//

const SizingTable = () => (
  <Row noGutters>
    <Col md={6} sm={12}>
      <Card>
        <Card.Header>
          <Card.Title as="h5">Extra Large Table</Card.Title>
        </Card.Header>
        <Card.Body>
          <Table responsive size="xl">
            <thead>
              <tr>
                <th>#</th>
                <th>First Name</th>
                <th>Last Name</th>
                <th>Username</th>
              </tr>
            </thead>
            <tbody>
              {(TableData || []).map((object, key) => (
                <tr key={key}>
                  <th scope="row" key={key}>
                    {object.id}
                  </th>
                  <td>{object.firstName}</td>
                  <td>{object.lastName}</td>
                  <td>{object.username}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </Col>
    <Col md={6} sm={12}>
      <Card>
        <Card.Header>
          <Card.Title as="h5">Large Table</Card.Title>
        </Card.Header>
        <Card.Body>
          <Table responsive size="lg">
            <thead>
              <tr>
                <th>#</th>
                <th>First Name</th>
                <th>Last Name</th>
                <th>Username</th>
              </tr>
            </thead>
            <tbody>
              {(TableData || []).map((object, key) => (
                <tr key={key}>
                  <th scope="row" key={key}>
                    {object.id}
                  </th>
                  <td>{object.firstName}</td>
                  <td>{object.lastName}</td>
                  <td>{object.username}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </Col>
    <Col md={6} sm={12}>
      <Card>
        <Card.Header>
          <Card.Title as="h5">Default Table</Card.Title>
        </Card.Header>
        <Card.Body>
          <Table responsive size="de">
            <thead>
              <tr>
                <th>#</th>
                <th>First Name</th>
                <th>Last Name</th>
                <th>Username</th>
              </tr>
            </thead>
            <tbody>
              {(TableData || []).map((object, key) => (
                <tr key={key}>
                  <th scope="row" key={key}>
                    {object.id}
                  </th>
                  <td>{object.firstName}</td>
                  <td>{object.lastName}</td>
                  <td>{object.username}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </Col>
    <Col md={6} sm={12}>
      <Card>
        <Card.Header>
          <Card.Title as="h5">Small Table</Card.Title>
        </Card.Header>
        <Card.Body>
          <Table responsive size="sm">
            <thead>
              <tr>
                <th>#</th>
                <th>First Name</th>
                <th>Last Name</th>
                <th>Username</th>
              </tr>
            </thead>
            <tbody>
              {(TableData || []).map((object, key) => (
                <tr key={key}>
                  <th scope="row" key={key}>
                    {object.id}
                  </th>
                  <td>{object.firstName}</td>
                  <td>{object.lastName}</td>
                  <td>{object.username}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </Col>
    <Col md={12}>
      <Card>
        <Card.Header>
          <Card.Title as="h5">Extra Small Table</Card.Title>
        </Card.Header>
        <Card.Body>
          <Table responsive size="xs">
            <thead>
              <tr>
                <th>#</th>
                <th>First Name</th>
                <th>Last Name</th>
                <th>Username</th>
              </tr>
            </thead>
            <tbody>
              {(TableData || []).map((object, key) => (
                <tr key={key}>
                  <th scope="row" key={key}>
                    {object.id}
                  </th>
                  <td>{object.firstName}</td>
                  <td>{object.lastName}</td>
                  <td>{object.username}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </Col>
  </Row>
);

export default SizingTable;
