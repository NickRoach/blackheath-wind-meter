import styled from "@emotion/styled";

export const ButtonContainer = styled.div`
  display: flex;
  width: 390px;
  justify-content: space-between;
  align-items: center;
`;

export const Heading = styled.h1`
  text-align: center;
  @media (max-width: 699px) {
    font-size: 18px;
  }
  @media (min-width: 700px) {
    font-size: 30px;
  }
`;

export const Label = styled.h2`
  font-size: 17px;
  color: rgb(55, 55, 71);
`;

export const ReadingHeading = styled.h2`
  font-style: italic;
  font-weight: light;
  font-size: 14px;
  width: 150px;
`;

export const Container = styled.div`
  margin-right: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  @media (max-width: 699px) {
    flex-direction: column;
    max-width: 500px;
  }
  @media (min-width: 700px) {
    flex-direction: row;
    width: 500px;
  }
`;

export const ValuesContainer = styled.div`
  @media (max-width: 699px) {
    text-align: center;
  }
  @media (min-width: 700px) {
    margin-left: 30px;
    width: 50%;
  }
`;

export const ChartContainer = styled.div`
  @media (max-width: 699px) {
    width: 100%;
    max-width: 250px;
    margin-top: 30px;
  }
  @media (min-width: 700px) {
    width: 50%;
  }
`;
