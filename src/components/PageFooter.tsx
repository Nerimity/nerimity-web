import { styled } from "solid-styled-components";
import { CustomLink } from "./ui/CustomLink";
import { FlexRow } from "./ui/Flexbox";

const FooterContainer = styled(FlexRow)`
  gap: 10px;
  align-items: center;
  justify-content: center;
  height: 30px;
  flex-shrink: 0;
`; 

export default function PageFooter() {
  return (
    <FooterContainer>
      <CustomLink decoration href="/privacy">Privacy Policy</CustomLink>
      <CustomLink decoration href="/terms-and-conditions">Terms And Conditions</CustomLink>
    </FooterContainer>
  )
}