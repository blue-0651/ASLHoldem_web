import React from 'react';

// react-bootstrap
import { Card } from 'react-bootstrap';

// params={{
//   title: 'Total Profit',
//     class: 'bg-c-red',
//     icon: 'feather icon-award',
//     primaryText: '$9,562',
//     secondaryText: 'This Month',
//     extraText: '$542'
// }}

// ==============================|| ORDER CARD ||============================== //
const OrderCard = ({ params }) => {
  let cardClass = ['order-card'];
  if (params.class) {
    cardClass = [...cardClass, params.class];
  }

  let iconClass = ['float-start'];
  if (params.icon) {
    iconClass = [...iconClass, params.icon];
  }

  return (
    <Card className={cardClass.join(' ')}>
      <Card.Body>
        <h6 className="text-white">{params.title}</h6>
        <h2 className="text-end text-white">
          <i className={iconClass.join(' ')} />
          <span>{params.primaryText}</span>
        </h2>
        <p className="mb-0">
          {params.secondaryText}
          <span className="float-end">{params.extraText}</span>
        </p>
      </Card.Body>
    </Card>
  );
};

export default OrderCard;
