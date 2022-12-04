import styled from "@emotion/styled";

const breakpoint = '500px';

export const Container = styled.div`
display: flex;
align-items: center;
justify-content: center;
@media(max-width: 390px) {
    flex-direction: column;
}
@media(min-width: 391px) {
    flex-direction: row;
}
`

export const ChartContainer = styled.div`
width: 50%;
`