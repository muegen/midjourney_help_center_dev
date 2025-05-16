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
    heading: "Contact Support",
    fields: [
      {
        label: "Full Name",
        name: "full_name",
        inputType: "TEXT",
        required: true,
      },
      {
        label: "Email",
        name: "email",
        inputType: "EMAIL",
        required: true,
      },
      {
        _type: "INCLUDE_CHAT_SESSION",
        defaultValue: false,
        label: "Include chat history",
        name: "include_chat_session",
      },
      {
        label: "Subject",
        name: "subject",
        inputType: "TEXT",
        required: true,
      },
      {
        label: "Message",
        name: "message",
        inputType: "TEXTAREA",
        required: true,
      },
      {
        label: "Category",
        name: "category",
        inputType: "SELECT",
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
    ],
    buttons: {
      submit: {
        label: 'Submit',
        // For chat widget submissions, the handler receives { values, conversation, client }
        onSubmit: async ({ values, conversation, client }) => {
          console.log(values);
          console.log(conversation);
          console.log(client);
          return handleSupportFormSubmit({ values, conversation, client });    
        },
      },
      close: {
        action: 'BACK_TO_CHAT',
      }
    },
    successView: {
      heading: 'Thank you!',
      message: `Your form has been submitted successfully.`,
    }
  };
  
  // ================================
  // Base Settings (API Key, Integration, Branding, etc.)
  // ================================
  const baseSettings = {
    // apiKey: atob("Zjg5N2M3MjZlZGI2OGJhNDQyMjgyZmNhYmMxNDgzNjJhZTdkMjQyMzk5ZmViOWY0"), // Prod
    apiKey: atob("OTZkMWE1MzQxZDFhZDc0YzBiYzQ5NzMzZjQ2ZTQwNDE0MDE4NWMwZDI3OTk1NDNm"), // Dev
    // integrationId: "cm3nex1x90084fezto6s92v24", // Prod
    integrationId: "cm86ej8ig0010s601krsslm0i", // Dev
    primaryBrandColor: "#efc5bb",
    organizationDisplayName: "Midjourney",
    organizationId: "org_BzKnYEJv6ppLg4T8",
    theme: {
      styles: [
        {
          key: "1",
          type: "style",
          value: `
                    data-theme=['light'] .ikp-search-bar__container {
                    background: white;
                    border-radius: 6px;
                    width: 100%;
                  }
                `,
        },
      ],
    },
  };
  
  // ================================
  // AI Chat Settings
  // ================================
  const aiChatSettings = {
    botAvatarSrcUrl: "https://midjourney.zendesk.com/hc/theming_assets/01JKCD6MRT350RFX8YKYJ3JMJN",
    quickQuestions: [
      "How to add Midjourney bot to my Discord server?",
      "What are some ways to get more precise image results?",
      "What parameters can I change when using Remix?",
      "How to upscale images?",
    ],
    tools: [
      {
        type: "function",
        function: {
          name: "provideAIAnnotations",
          descriptiong: "Provide AI Annotations",
          parameters: escalationSchema,
        },
      },
    ],
    onToolCall: (toolCall) => {
      if (toolCall.name === "provideAIAnnotations") {
        const data = JSON.parse(toolCall.arguments);
        const confidence = data.aiAnnotations.answerConfidence;
        if (confidence !== "very_confident") {
          return {
            label: "Contact Support",
            icon: { builtIn: "LuUsers" },
            action: {
              type: "OPEN_FORM",
              formConfig: supportFormConfig,
            },
          };
        }
      }
    },
    getHelpCallToActions: [
      {
        icon: { builtIn: "LuUsers" },
        name: "Contact support",
        action: {
          type: "OPEN_FORM",
          formConfig: supportFormConfig,
        },
      },
    ],
  }; 
  
  // ================================
  // Helper Functions for Ticket Submission
  // ================================
  
  /**
   * Constructs the comment body for the ticket.
   * If chat session details are provided, includes chat messages.
   */
  function buildCommentBody({ chatSession, client, message }) {
    let body = `**Chat Current URL:** ${client && client.currentUrl ? client.currentUrl : ''}\n\n`;
    if (chatSession && chatSession.messages && chatSession.messages.length > 0) {
      body += '### **Chat Messages:**\n\n';
      body += chatSession.messages
        .map((msg, index) => {
          const roleFormatted = msg.role.charAt(0).toUpperCase() + msg.role.slice(1);
          return `------------------------------\n**[${index + 1}] ${roleFormatted}:**\n${msg.content.trim()}\n`;
        })
        .join('\n') + '\n';
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
    const authToken = atob("Y0docGJHeHBjQzVrWVc1dVpYSkFjM1Z3Y0c5eWRHNXBibXBoTG1OdmJTOTBiMnRsYmpwUmMyaEZlalU0VkdSU1FrZG1Sekp2ZG1GTGNGQm1ZMDV5TWpnMWNFaHJWamxwYnpBeVdqZGg=");
    
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
          "Authorization": `Basic ${authToken}`,
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
    return submitTicket({ formDetails: values, chatSession: conversation, client });
  }
  
  /**
   * Handles support form submissions from the contact form.
   * Expects { values }.
   */
  async function handleContactFormSubmit({ values }) {
    return submitTicket({ formDetails: values });
  }
  
  // ================================
  // Inkeep Widget Initialization
  // ================================
  document.addEventListener("DOMContentLoaded", () => {
    // Wait for InkeepConfig to be defined
    // const waitForConfig = (retries = 5) => {
    //   if (typeof window.InkeepConfig !== "undefined") {
    //     if (window.InkeepConfig.apiKey && window.InkeepConfig.integrationId) {
    //       console.log("InkeepConfig loaded successfully:");
    //     } else {
    //       console.warn("InkeepConfig is missing required properties:", window.InkeepConfig);
    //     }
    //   } else if (retries > 0) {
    //     setTimeout(() => waitForConfig(retries - 1), 200);
    //   } else {
    //     console.error("InkeepConfig is missing after multiple retries.");
    //   }
    // };
  
    // // Load the Inkeep widget script dynamically
    // const loadInkeepScript = () => {
    //   const script = document.createElement("script");
    //   script.src = "https://unpkg.com/@inkeep/widget-js@0.5.0-rc.2/dist/embed.js";
    //   script.id = "inkeep-script";
    //   script.type = "module";
    //   script.defer = true;
  
    //   script.onload = () => {
    //     waitForConfig();
    //   };
  
    //   script.onerror = () => {
    //     console.error("Failed to load Inkeep script.");
    //   };
  
    //   document.head.appendChild(script);
    // };
  
    // loadInkeepScript();
  
    // Check if the Inkeep script is loaded
    const inkeepScript = document.getElementById("inkeep-script");
    if (inkeepScript) {
      console.log("Inkeep script element found:", inkeepScript);
    }
  
    // Initialize Inkeep widgets
    // initializeInkeepWidgets(window.InkeepConfig);
    initializeInkeepWidgets()
  });
  
  function initializeInkeepWidgets() {
    // Initialize Chat Button
    const inkeepChatButton = Inkeep.ChatButton({ baseSettings, aiChatSettings });
  
    // // Initialize Search Bar
    // const searchBarNav = Inkeep.SearchBar("#inkeepSearchBarNav", {
    //   baseConfig,
    //   searchSettings: { placeholder: "Search" },
    // });
    // const searchBarHero = Inkeep.SearchBar("#inkeepSearchBarHero", {
    //   baseConfig,
    //   searchSettings: { placeholder: "Search" },
    //   modalSettings: { shortcutKey: null },
    // });
  }
  
  
  
  