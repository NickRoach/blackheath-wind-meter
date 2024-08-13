# Blackheath wind gauge

This is a monorepo containing the components of an end-to-end weather station system for recording wind speed and direction.

It is for the Mt Blackheath glider launch in the Blue Mountains NSW.

## The gauge

It is based on an arduino pro mini. Charged by solar power, uses a cup anemometer to sample wind speed every ten seconds and saved in a compact form to not overload arduino dynamic memory. Collected data is sent via a mobile network transceiver every 10 minutes.

## Dispatch lambda

The data from the gauge is received by a lambda function called weatherStation on AWS. This is deployed by the github action deploy-dispatchLambda. This does not use pulumi, so all configuration is through AWS console.
This lambda function dispatches the data unchanged to two secondary lambdas, one each for the dev and prod environments. There is no separate dev and prod version of this lambda, so think carefully before running the deploy action.

## Secondary lambdas

There are two of these, one for dev and prod. These receive the data from the weather station via the dispatch lambda. The store it in a json file.
These lambdas also serve the frontEnd via get requests.
These are deployed by a pulumi script found in the pulumi directory using pulumi up --stack dev. A github action deploys the dev lambda on merge into develop. The prod lambda is deployed by the deployToProd workflow, which must be triggered manually in the github console.

## Frontend

This is an HTML page and a vanilla js script that produces a plot of the data. The data are requested from the secondary lambda and then displayed. The data are not compiled at all: every data point is plotted to allow the user to make their own judgement on whatever qualities of the conditions they happen to be interested in. Wind direction calibration is set in the script and the original data has no direction calibration applied to it.
Continuous deployment occurs to the dev environment on merge into develop. Manually running the deployToProd workflow does exactly what the name indicates.

## Down for maintenance

This is a page that can be deployed manually using a github action. It can be used whenever the prod system stops working for whatever reason