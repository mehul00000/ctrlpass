import React from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { BouncyAccordion } from '../../components/bouncy-accordion';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '../../theme';

export type InfoDoc =
  | 'terms'
  | 'privacy'
  | 'about'
  | 'help';

const TERMS = [
  [
    '1. Accounts',
    'You must provide accurate details. You are responsible for activity on your account and for keeping your credentials secure.',
  ],
  [
    '2. Tickets & bookings',
    "A booking is confirmed only when the backend marks it CONFIRMED. Tickets are personal; reselling via unofficial channels may void them at the organizer's discretion.",
  ],
  [
    '3. Events',
    "Events are run by organizers. CtrlPass provides the ticketing and check-in platform; event content, safety and refunds follow the organizer's published policy.",
  ],
  [
    '4. Cancellations & refunds',
    "Refund eligibility is defined by each event's refund policy. Approved refunds are processed to the original payment method.",
  ],
  [
    '5. Conduct',
    'Do not attempt to forge, resell fraudulently, or scan tickets without authorization. Abuse leads to account suspension.',
  ],
  [
    '6. Changes',
    'These terms may be updated; material changes will be surfaced in the app and require renewed consent.',
  ],
];

const PRIVACY = [
  [
    'What we collect',
    'Account details (name, email or phone), optional profile info (city, photo), bookings and tickets, check-in records, and basic technical diagnostics.',
  ],
  [
    'Why',
    'To create your account, issue and validate tickets, prevent fraud at gates, and support you. We do not sell your data.',
  ],
  [
    'Payments',
    'Card details are processed by our PCI-DSS payment provider. CtrlPass stores only payment status and references.',
  ],
  [
    'Sharing',
    'Organizers of events you attend can see your booking and ticket status. Check-in records are shared with gate staff of that event only.',
  ],
  [
    'Retention & deletion',
    'Booking and payment records are retained as required by financial rules. You can deactivate your account anytime from the Privacy Center.',
  ],
  [
    'Contact',
    'Privacy questions: privacy@ctrlpass.in',
  ],
];

const TITLES: Record<InfoDoc, string> = {
  terms: 'Terms of Service',
  privacy: 'Privacy Policy',
  about: 'About CtrlPass',
  help: 'Help & Support',
};

export default function InfoScreen({
  route,
}: {
  route: { params: { doc: InfoDoc } };
}) {
  const insets = useSafeAreaInsets();
  const doc = route.params?.doc ?? 'about';

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: insets.top + 12,
            paddingBottom: insets.bottom + 40,
          },
        ]}
      >
        {doc === 'terms' && (
          <DocumentLayout
            eyebrow="LEGAL"
            title={TITLES[doc]}
            intro="The rules that govern your use of CtrlPass and the ticketing platform."
          >
            <BouncyAccordion
              items={TERMS.map(([heading, body]) => ({
                id: heading,
                title: heading,
                description: body,
              }))}
            />
          </DocumentLayout>
        )}

        {doc === 'privacy' && (
          <DocumentLayout
            eyebrow="YOUR DATA"
            title={TITLES[doc]}
            intro="How CtrlPass handles account, booking, ticket and operational information."
          >
            <BouncyAccordion
              items={PRIVACY.map(([heading, body]) => ({
                id: heading,
                title: heading,
                description: body,
              }))}
            />
          </DocumentLayout>
        )}

        {doc === 'about' && (
          <AboutContent />
        )}

        {doc === 'help' && (
          <HelpContent />
        )}
      </ScrollView>
    </View>
  );
}

function DocumentLayout({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>
          {eyebrow}
        </Text>

        <Text style={styles.title}>
          {title}
        </Text>

        <Text style={styles.intro}>
          {intro}
        </Text>
      </View>

      <View style={styles.document}>
        {children}
      </View>
    </>
  );
}

function DocumentSection({
  heading,
  body,
}: {
  heading: string;
  body: string;
}) {
  return (
    <View style={styles.documentSection}>
      <Text style={styles.documentHeading}>
        {heading}
      </Text>

      <Text style={styles.documentBody}>
        {body}
      </Text>
    </View>
  );
}

function AboutContent() {
  return (
    <>
      <View style={styles.aboutHero}>
        <View style={styles.brandMark}>
          <Text style={styles.brandMarkText}>
            C
          </Text>
        </View>

        <Text style={styles.aboutEyebrow}>
          THE EVENT PASS
        </Text>

        <Text style={styles.aboutTitle}>
          CtrlPass
        </Text>

        <Text style={styles.aboutDescription}>
          Event ticketing and gate check-in, built for
          colleges and independent organizers.
        </Text>
      </View>

      <View style={styles.aboutDetails}>
        <InfoLine
          label="VERSION"
          value="1.0.0"
        />

        <View style={styles.aboutDivider} />

        <InfoLine
          label="COMPANY"
          value="CtrlPass · India"
        />
      </View>

      <View style={styles.aboutStatement}>
        <Text style={styles.aboutStatementLabel}>
          BUILT AROUND THE EXPERIENCE
        </Text>

        <Text style={styles.aboutStatementText}>
          Discover events, book your place, receive a
          secure digital pass and walk through the gate
          with confidence.
        </Text>
      </View>
    </>
  );
}

function InfoLine({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoLine}>
      <Text style={styles.infoLabel}>
        {label}
      </Text>

      <Text style={styles.infoValue}>
        {value}
      </Text>
    </View>
  );
}

function HelpContent() {
  return (
    <>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>
          SUPPORT
        </Text>

        <Text style={styles.title}>
          How can we help?
        </Text>

        <Text style={styles.intro}>
          Quick answers for the moments that matter
          before you reach the gate.
        </Text>
      </View>

      <View style={styles.helpList}>
        <HelpItem
          number="01"
          heading="Ticket not scanning?"
          body="Make sure your screen brightness is high and the full QR is visible. Gate staff can also look up your ticket by name or phone."
        />

        <HelpItem
          number="02"
          heading="Payment deducted, no ticket?"
          body="Your booking may still be processing — check Passes in a minute. If it stays stuck, contact support with your booking ID."
        />
      </View>

      <View style={styles.contactSection}>
        <Text style={styles.contactEyebrow}>
          STILL NEED HELP?
        </Text>

        <Text style={styles.contactTitle}>
          Talk to the CtrlPass team.
        </Text>

        <Text style={styles.contactText}>
          Include your booking ID whenever you're
          contacting us about a payment or ticket.
        </Text>

        <SupportAction
          label="Email support"
          detail="support@ctrlpass.in"
          onPress={() =>
            Linking.openURL(
              'mailto:support@ctrlpass.in?subject=CtrlPass%20support',
            ).catch(() =>
              Alert.alert(
                'No mail app',
                'Email us at support@ctrlpass.in',
              ),
            )
          }
        />

        <SupportAction
          label="Report a problem"
          detail="Open a support request"
          onPress={() =>
            Linking.openURL(
              'mailto:support@ctrlpass.in?subject=CtrlPass%20problem%20report',
            ).catch(() =>
              Alert.alert(
                'No mail app',
                'Email us at support@ctrlpass.in',
              ),
            )
          }
          last
        />
      </View>
    </>
  );
}

function HelpItem({
  number,
  heading,
  body,
}: {
  number: string;
  heading: string;
  body: string;
}) {
  return (
    <View style={styles.helpItem}>
      <View style={styles.helpNumber}>
        <Text style={styles.helpNumberText}>
          {number}
        </Text>
      </View>

      <View style={styles.helpCopy}>
        <Text style={styles.helpHeading}>
          {heading}
        </Text>

        <Text style={styles.helpBody}>
          {body}
        </Text>
      </View>
    </View>
  );
}

function SupportAction({
  label,
  detail,
  onPress,
  last,
}: {
  label: string;
  detail: string;
  onPress: () => void;
  last?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.supportAction,
        last && styles.supportActionLast,
        pressed && styles.supportPressed,
      ]}
    >
      <View style={styles.supportCopy}>
        <Text style={styles.supportLabel}>
          {label}
        </Text>

        <Text style={styles.supportDetail}>
          {detail}
        </Text>
      </View>

      <View style={styles.chevronCircle}>
        <Text style={styles.chevron}>
          ›
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#050505',
  },

  scroll: {
    paddingHorizontal: 20,
  },

  /* Shared document header */

  header: {
    paddingTop: 8,
    marginBottom: 30,
  },


  eyebrow: {
    color: colors.champagne,
    fontSize: 11,
    fontWeight: '700',
        marginBottom: 11,
  },


  title: {
    color: '#F5F5F2',
    fontSize: 32,
    lineHeight: 36,
    fontWeight: '700',
    letterSpacing: -1.15,
  },

  intro: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 12,
    maxWidth: 350,
  },

  /* Legal / privacy */

  document: {
    borderTopWidth: 1,
    borderColor: '#1D1D1D',
  },

  documentSection: {
    paddingVertical: 21,
    borderBottomWidth: 1,
    borderBottomColor: '#1D1D1D',
  },


  documentHeading: {
    color: '#E4E2DC',
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '600',
    letterSpacing: -0.15,
    marginBottom: 8,
  },

  documentBody: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 19,
  },

  /* About */

  aboutHero: {
    backgroundColor: '#101010',
    borderWidth: 1,
    borderColor: '#202020',
    borderRadius: 24,
    padding: 23,
    minHeight: 255,
    justifyContent: 'flex-end',
    marginBottom: 12,
  },

  brandMark: {
    position: 'absolute',
    top: 22,
    right: 22,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#181715',
    borderWidth: 1,
    borderColor: 'rgba(214,180,122,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  brandMarkText: {
    color: colors.champagne,
    fontSize: 26,
    fontWeight: '700',
  },


  aboutEyebrow: {
    color: colors.champagne,
    fontSize: 11,
    fontWeight: '700',
        marginBottom: 8,
  },


  aboutTitle: {
    color: '#F5F5F2',
    fontSize: 36,
    lineHeight: 40,
    fontWeight: '700',
    letterSpacing: -1.4,
  },

  aboutDescription: {
    color: '#85817A',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 9,
    maxWidth: 290,
  },

  aboutDetails: {
    backgroundColor: '#101010',
    borderWidth: 1,
    borderColor: '#202020',
    borderRadius: 18,
    paddingHorizontal: 16,
    marginBottom: 12,
  },

  infoLine: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },


  infoLabel: {
    color: '#5F5C57',
    fontSize: 11,
    fontWeight: '700',
      },

  infoValue: {
    color: '#D6D3CC',
    fontSize: 12,
    fontWeight: '600',
  },

  aboutDivider: {
    height: 1,
    backgroundColor: '#242424',
  },

  aboutStatement: {
    paddingTop: 26,
  },


  aboutStatementLabel: {
    color: '#5F5C57',
    fontSize: 11,
    fontWeight: '700',
        marginBottom: 10,
  },


  aboutStatementText: {
    color: '#AAA69F',
    fontSize: 15,
    lineHeight: 23,
    letterSpacing: -0.15,
  },

  /* Help */

  helpList: {
    borderTopWidth: 1,
    borderColor: '#1D1D1D',
    marginBottom: 28,
  },

  helpItem: {
    flexDirection: 'row',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1D1D1D',
  },

  helpNumber: {
    width: 31,
    height: 31,
    borderRadius: 16,
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#292929',
    alignItems: 'center',
    justifyContent: 'center',
  },

  helpNumberText: {
    color: colors.champagne,
    fontSize: 8,
    fontWeight: '700',
  },

  helpCopy: {
    flex: 1,
    marginLeft: 13,
  },

  helpHeading: {
    color: '#E1DED7',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },

  helpBody: {
    color: '#706C65',
    fontSize: 11,
    lineHeight: 18,
  },

  /* Contact */

  contactSection: {
    backgroundColor: '#101010',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#202020',
    padding: 18,
  },


  contactEyebrow: {
    color: colors.champagne,
    fontSize: 11,
    fontWeight: '700',
        marginBottom: 9,
  },


  contactTitle: {
    color: '#EAE8E2',
    fontSize: 19,
    fontWeight: '700',
    letterSpacing: -0.35,
  },

  contactText: {
    color: '#6D6962',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 6,
    marginBottom: 17,
  },

  supportAction: {
    minHeight: 57,
    borderTopWidth: 1,
    borderTopColor: '#252525',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  supportActionLast: {
    borderBottomWidth: 0,
  },

  supportPressed: {
    opacity: 0.7,
  },

  supportCopy: {
    flex: 1,
  },

  supportLabel: {
    color: '#D5D2CB',
    fontSize: 12,
    fontWeight: '600',
  },

  supportDetail: {
    color: '#65615B',
    fontSize: 10,
    marginTop: 3,
  },

  chevronCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
  },

  chevron: {
    color: '#AAA69F',
    fontSize: 20,
    lineHeight: 22,
    marginTop: -2,
  },
});