import React from 'react';

// react bootstrap
import { Row, Col, Card, Table } from 'react-bootstrap';

// project imports
import { TableData } from 'data/tableData';

// -----------------------|| BORDER TABLE ||-----------------------//

const BorderTable = () => (
  <Row noGutters>
    <Col md={6} sm={12}>
      <Card>
        <Card.Header>
          <Card.Title as="h5">Both Borders</Card.Title>
        </Card.Header>
        <Card.Body>
          <Table responsive bordered>
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
          <Card.Title as="h5">Borderless</Card.Title>
        </Card.Header>
        <Card.Body>
          <Table responsive borderless>
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
          <Card.Title as="h5">Default Table Border</Card.Title>
        </Card.Header>
        <Card.Body>
          <Table responsive>
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
          <Card.Title as="h5">Border Bottom Color</Card.Title>
        </Card.Header>
        <Card.Body>
          <Table responsive>
            <thead>
              <tr className="border-bottom-danger">
                <th>#</th>
                <th>First Name</th>
                <th>Last Name</th>
                <th>Username</th>
              </tr>
            </thead>
            <tbody>
              {(TableData || []).map((object, key) => (
                <tr key={key} className="border-bottom-primary">
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

export default BorderTable;
