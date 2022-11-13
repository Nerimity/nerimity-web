import { styled } from "solid-styled-components"
import { FlexColumn, FlexRow } from "./ui/Flexbox";

const DashboardPaneContainer = styled(FlexColumn)`
  justify-content: center;
  align-items: center;
  height: 100%;
`;

const DashboardPaneContent = styled(FlexColumn)`
  place-self: stretch;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  padding: 10px;
  flex: 1;
  margin: 20px;
  margin-left: 80px;
  margin-right: 80px;
`;


export default function DashboardPane() {
  return (
    <DashboardPaneContainer>
      <DashboardPaneContent>
        {/* <ServerList/> */}
      </DashboardPaneContent>
    </DashboardPaneContainer>
  )
}