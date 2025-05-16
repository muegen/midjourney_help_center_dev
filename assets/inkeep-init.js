// inkeep-init.js

// ================================
// Schema for AI Annotations (Escalation from AI to Support)
// ================================
export const escalationSchema = {
  type: "object",
  properties: {
    aiAnnotations: {
      type: "object",
      properties: {
        answerConfidence: {
          anyOf: [
            {
              type: "string",
              const: "very_confident",
              description: "Very confident",
            },
            {
              type: "string",
              const: "somewhat_confident",
              description: "Somewhat confident",
            },
            {
              type: "string",
              const: "not_confident",
              description: "Not confident",
            },
            {
              type: "string",
              const: "no_sources",
              description: "No Sources",
            },
            {
              type: "string",
              const: "other",
              description: "Other",
            },
          ],
        },
      },
      required: ["answerConfidence"],
      additionalProperties: true,
    },
  },
  required: ["aiAnnotations"],
  additionalProperties: false,
  $schema: "http://json-schema.org/draft-07/schema#",
};

// ================================
// Support Form Configuration (Contact Form from AI Chat)
// ================================
const supportFormConfig = {
  heading: "Contact Billing Support",
  fields: [
    {
      inputType: "text",
      name: "full_name",
      label: "Full Name",
      isRequired: true,

    },
    {
      inputType: "email",
      name: "email",
      label: "Email",
      isRequired: true,
    },
    {
      inputType: "text",
      name: "subject",
      label: "Subject",
      isRequired: true,
    },
    {
      inputType: "textarea",
      name: "message",
      label: "Message",
      isRequired: true,
    },
    {
      inputType: "select",
      name: "category",
      label: "Category",
      isRequired: false,
      items: [
        {
          label: "Login & Account Issues",
          value: "hd_account_issue",
        },
        {
          label: "Technical Support",
          value: "hd_technical_support",
        },
        {
          label: "Billing & Payments",
          value: "hd_billing",
        },
        {
          label: "Feedback & Suggestions",
          value: "hd_feedback",
        },
      ],
    },
    {
      _type: "include_chat_session",
      name: "include_chat_session",
      label: "Include Chat History",
      defaultValue: true,
      isHidden: true,
    },
  ],
  buttons: {
    submit: {
      label: "Submit",
      onSubmit: async ({ values, conversation}) => {
        // client = current url
        const client = {
          currentUrl: window.location.href,
        };
        console.log(values);
        console.log(conversation);
        console.log(client);
        return handleSupportFormSubmit({ values, conversation, client });
      },
    },
    close: {
      label: "Back to Chat",
      action: "return_to_chat",
    },
  },
  successView: {
    heading: "Thank you!",
    message: "Your form has been submitted successfully.",
    doneButton: {
      label: "Back to Chat",
      action: "return_to_chat",
    },
  },
};

// ================================
// Configuration for Inkeep Widgets
// ================================
const config = {
  // ================================
  // Base Settings (Branding, Styles, etc.)
  // ================================
  baseSettings: {
    // apiKey: atob("Zjg5N2M3MjZlZGI2OGJhNDQyMjgyZmNhYmMxNDgzNjJhZTdkMjQyMzk5ZmViOWY0"), // Prod
    apiKey: atob(
      "OTZkMWE1MzQxZDFhZDc0YzBiYzQ5NzMzZjQ2ZTQwNDE0MDE4NWMwZDI3OTk1NDNm"
    ), // Dev
    primaryBrandColor: "#efc5bb",
    organizationDisplayName: "Midjourney",
    styles: [
      {
        key: "main",
        type: "style",
        value: `
            .ikp-search-bar__container {
                background: white;
                border-radius: 6px;
                width: 100%;
            }
            `,
      },
    ],
  },

  // ================================
  // AI Chat Settings
  // ================================
  aiChatSettings: {
    aiAssistantAvatar: {
      light: "https://midjourney.zendesk.com/hc/theming_assets/01JKCD6MRT350RFX8YKYJ3JMJN",
      dark: "https://midjourney.zendesk.com/hc/theming_assets/01JKCD6MRT350RFX8YKYJ3JMJN",
    },
    exampleQuestions: [
      "How to add Midjourney bot to my Discord server?",
      "What are some ways to get more precise image results?",
      "What parameters can I change when using Remix?",
      "How to upscale images?",
    ],
    // Dynamic button on chat widget to contact support on low confidence answers
    getTools: () => [
      {
        type: "function",
        function: {
          name: "provideAnswerConfidence",
          description:
            "Determine how confident the AI assistant was and whether or not to escalate to support",
          parameters: escalationSchema,
        },
        renderMessageButtons: ({ args }) => {
          const confidence = args.aiAnnotations.answerConfidence;
          if (["not_confident", "no_sources", "other"].includes(confidence)) {
            return [
              {
                label: "Contact Billing Support",
                icon: { builtIn: "LuUsers" },
                action: {
                  type: "open_form",
                  formSettings: supportFormConfig,
                },
              },
            ];
          }
          return [];
        },
      },
    ],
    // Static button on chat widget to contact support
    getHelpOptions: [
      {
        name: "Contact Billing Support",
        icon: { builtIn: "LuUsers" },
        action: {
          type: "open_form",
          formSettings: supportFormConfig,
        },
        isPinnedToToolbar: true,
      },
    ],
  },

  // ================================
  // AI Search Settings
  // ================================  
  searchSettings: {
    placeholder: "Search",
    modalSettings: {
      // shortcutKey: null,
    }
  },  
};

// ================================
// Helper Functions for Ticket Submission
// ================================

/**
 * Constructs the comment body for the ticket.
 * If chat session details are provided, includes chat messages.
 */
function buildCommentBody({ chatSession, client, message }) {
  let body = `**Chat Current URL:** ${
    client && client.currentUrl ? client.currentUrl : ""
  }\n\n`;
  if (chatSession && chatSession.messages && chatSession.messages.length > 0) {
    body += "### **Chat Messages:**\n\n";
    body +=
      chatSession.messages
        .map((msg, index) => {
          const roleFormatted =
            msg.role.charAt(0).toUpperCase() + msg.role.slice(1);
          return `------------------------------\n**[${
            index + 1
          }] ${roleFormatted}:**\n${msg.content.trim()}\n`;
        })
        .join("\n") + "\n";
  }
  body += `------------------------------\n\n### **User Message:**\n${message}`;
  return body;
}

/**
 * Submits a ticket to Zendesk.
 * Accepts form details plus optional chat session and client info.
 */
async function submitTicket({ formDetails, chatSession = null, client = {} }) {
  // const zendeskApiUrl = "https://docs.midjourney.com/api/v2/tickets";
  const zendeskApiUrl = "https://midjourneydev.zendesk.com/api/v2/tickets";
  const authToken = atob(
    "Y0docGJHeHBjQzVrWVc1dVpYSkFjM1Z3Y0c5eWRHNXBibXBoTG1OdmJTOTBiMnRsYmpwUmMyaEZlalU0VkdSU1FrZG1Sekp2ZG1GTGNGQm1ZMDV5TWpnMWNFaHJWamxwYnpBeVdqZGg="
  );

  const commentBody = buildCommentBody({
    chatSession,
    client,
    message: formDetails.message,
  });

  const ticketData = {
    ticket: {
      subject: formDetails.subject,
      description: formDetails.message,
      comment: {
        body: commentBody,
        public: true,
      },
      requester: {
        name: formDetails.full_name,
        email: formDetails.email,
      },
      status: "new",
      tags: [
        "helpdesk",
        ...(formDetails.category ? [formDetails.category] : []),
      ],
    },
  };

  try {
    const response = await fetch(zendeskApiUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(ticketData),
    });

    if (!response.ok) {
      const errorDetails = await response.json();
      throw new Error(`API Error: ${response.status} - ${errorDetails.error}`);
    }

    const responseData = await response.json();
    console.log("Ticket created successfully", responseData);
    return { success: true, data: responseData };
  } catch (error) {
    console.error("Error during form submission:", error);
    return Promise.reject(error);
  }
}

/**
 * Handles support form submissions from the chat widget.
 * Expects { values, conversation, client }.
 */
async function handleSupportFormSubmit({ values, conversation, client }) {
  return submitTicket({
    formDetails: values,
    chatSession: conversation,
    client,
  });
}

// ================================
// Inkeep Widget Initialization
// ================================
document.addEventListener("DOMContentLoaded", () => {
  // Check if the Inkeep script is loaded
  const inkeepScript = document.getElementById("inkeep-script");
  if (inkeepScript) {
    console.log("Inkeep script element found");
  }

  // Initialize Inkeep widgets
  initializeInkeepWidgets();
});

function initializeInkeepWidgets() {
  // Initialize Chat Button
  const inkeepChatButton = Inkeep.ChatButton({ config });

  // Initialize Search Bar
  const searchBarNav = Inkeep.SearchBar("#inkeepSearchBarNav", {
    config,
  });
  const searchBarHero = Inkeep.SearchBar("#inkeepSearchBarHero", {
    config,
  });
}
