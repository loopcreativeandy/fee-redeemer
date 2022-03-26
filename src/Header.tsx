
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import { EmptyAccount, MAX_CLOSE_INSTRUCTIONS, TotalRedemptions, solForEmptyAccounts } from './fee-redeemer';

type HeaderProps = {
  emptyAccounts?: EmptyAccount[];
  totalRedemptions?: TotalRedemptions;
};

export const Header = ({ emptyAccounts, totalRedemptions }: HeaderProps) => {
  const txcnt = emptyAccounts?Math.ceil(emptyAccounts?.length / MAX_CLOSE_INSTRUCTIONS):0;
  return (
    <Grid container direction="row" justifyContent="center" wrap="nowrap">
      <Grid container direction="row" wrap="nowrap">
        {emptyAccounts && (
          <Grid container direction="row" wrap="nowrap">
            <Grid container direction="column">
              <Typography variant="body2" color="textSecondary">
                Empty Accounts
              </Typography>
              <Typography
                variant="h6"
                color="textPrimary"
                style={{
                  fontWeight: 'bold',
                }}
              >
                {`${emptyAccounts?.length}`}
              </Typography>
            </Grid>
            <Grid container direction="column">
              <Typography variant="body2" color="textSecondary">
                You can redeem
              </Typography>
              <Typography
                variant="h6"
                color="textPrimary"
                style={{ fontWeight: 'bold' }}
              >
                {getPriceString(solForEmptyAccounts(emptyAccounts))}
              </Typography>
              {emptyAccounts?.length > 0 && 
                <Typography variant="body2" color="textSecondary">
                  in {`${txcnt}`} transaction{txcnt !== 1 && 's'}
                </Typography> 
              }
            </Grid>
            <Grid container direction="column">
              <Typography variant="body2" color="textSecondary">
                Total Redemmed
              </Typography>
              <Typography
                variant="h6"
                color="textPrimary"
                style={{
                  fontWeight: 'bold',
                }}
              >
                {totalRedemptions && getPriceString(totalRedemptions?.totalSolRedeemed)}
              </Typography>
            </Grid>
          </Grid>
        )}
        
      </Grid>
    </Grid>
  );
};

const getPriceString = (price: number): string => {
  return `◎ ${price.toFixed(3)}`;
};
