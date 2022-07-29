import styled from 'styled-components';
import Button from '@material-ui/core/Button';
import { CircularProgress } from '@material-ui/core';
import { useState } from 'react';
import { EmptyAccount } from './fee-redeemer';

export const CTAButton = styled(Button)`
  width: 100%;
  height: 60px;
  margin-top: 10px;
  margin-bottom: 5px;
  background: linear-gradient(180deg, #604ae5 0%, #813eee 100%);
  color: white;
  font-size: 16px;
  font-weight: bold;
`; // add your own styles here

export const RedeemButton = ({
  onClick,
  emptyAccounts,
}: {
  onClick: () => Promise<void>;
  emptyAccounts?: EmptyAccount[];
}) => {
  const [clicked, setClicked] = useState(false);

  const getRedeemButtonContent = () => {
    if (clicked) {
      return <CircularProgress />;
    } else if (emptyAccounts?.length === 0) {
      return 'NO EMPTY ACCOUNTS';
    }

    return 'REDEEM';
  };

  return (
    <CTAButton
      disabled={clicked || emptyAccounts?.length === 0}
      onClick={async () => {
        setClicked(true);
        await onClick();
        setClicked(false);
      }}
      variant="contained"
    >
      {getRedeemButtonContent()}
    </CTAButton>
  );
};
