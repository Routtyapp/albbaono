import { Divider, Container } from '@mantine/core';
import {
  Hero,
  Problem,
  Solution,
  Framework,
  CaseStudy,
  Pricing,
  CTA,
} from '../components/sections';

export function Landing() {
  return (
    <>
      <Hero />
      <Container size={1440} px={{ base: 20, md: 40 }}>
        <Divider color="gray.3" />
      </Container>
      <Problem />
      <Solution />
      <Framework />
      <CaseStudy />
      <Pricing />
      <CTA />
    </>
  );
}
