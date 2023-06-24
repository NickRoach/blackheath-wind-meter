import styled from "@emotion/styled";

export const ButtonContainer = styled.div`
  display: flex;
  width: 390px;
  justify-content: space-between;
  align-items: center;
`;

export const HeadingContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justifycontent: center;
  overflow-wrap: break-word;
  @media (max-width: 699px) {
    width: 180px;
  }
`;

export const ImageContainer = styled.div`
  @media (max-width: 699px) {
    width: 50px;
    height: 50px;
  }
  @media (min-width: 700px) {
    width: 70px;
    height: 70px;
  }
  position: relative;
`;

export const Heading = styled.h1`
  text-align: center;
  color: rgb(55, 55, 71);
  @media (max-width: 699px) {
    font-size: 18px;
  }
  @media (min-width: 700px) {
    font-size: 30px;
  }
  line-height: 100%;
`;

export const SubHeading = styled.p`
  text-align: center;
  max-width: 550px;
  color: rgb(55, 55, 71);
  @media (max-width: 699px) {
    font-size: 10px;
  }
  @media (min-width: 700px) {
    font-size: 15px;
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

export const DirectionHeading = styled.h2`
  font-style: italic;
  font-weight: light;
  font-size: 14px;
  text-align: center;
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
