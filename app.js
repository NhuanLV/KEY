(() => {
  "use strict";

  const GEMINI_API_KEY = "AIzaSyB1IRXmsw95yMxve3zCwQlvDQU59y8n5HU";
  const PROVIDER_STORAGE_KEY = "ai-study-provider-v1";
  const MODEL_STORAGE_KEY = "ai-study-model-v1";
  const OPENAI_KEY_STORAGE_KEY = "ai-study-openai-key-v1";
  const DEFAULT_PROVIDER = "gemini";
  const PRIMARY_MODEL = "gemini-2.5-flash";
  const FALLBACK_MODELS = ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.5-flash-lite"];
  const PROVIDER_MODELS = {
    gemini: [
      { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
      { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
      { id: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite" }
    ],
    openai: [
      { id: "gpt-5.1", label: "GPT-5.1" },
      { id: "gpt-5.1-thinking", label: "GPT-5.1 Thinking", model: "gpt-5.1", reasoningEffort: "high" },
      { id: "gpt-5.1-chat-latest", label: "GPT-5.1 Chat" },
      { id: "gpt-5", label: "GPT-5" },
      { id: "gpt-5-thinking", label: "GPT-5 Thinking", model: "gpt-5", reasoningEffort: "high" },
      { id: "gpt-5-pro", label: "GPT-5 Pro", model: "gpt-5-pro", reasoningEffort: "high" },
      { id: "gpt-5-mini", label: "GPT-5 Mini" },
      { id: "gpt-5-nano", label: "GPT-5 Nano" },
      { id: "gpt-4.1", label: "GPT-4.1" },
      { id: "gpt-4.1-mini", label: "GPT-4.1 Mini" }
    ]
  };
  const TEMPERATURE = 0.15;
  const THINKING_BUDGET = 4096;
  const MAX_ATTACHMENTS = 8;
  const MAX_TURN_BYTES = 100 * 1024 * 1024;
  const INLINE_FILE_BYTES = 18 * 1024 * 1024;
  const MAX_TEXT_INLINE_BYTES = 1.5 * 1024 * 1024;
  const MAX_HISTORY_MESSAGES = 10;
  const FILE_PROCESS_TIMEOUT_MS = 120000;
  const FILE_PROCESS_POLL_MS = 2000;
  const PDF_RENDER_TARGET_WIDTH = 3200;
  const PDF_RENDER_MAX_SCALE = 5;
  const PDF_RENDER_MAX_PAGES = 12;
  const PDF_RENDER_MAX_IMAGES = 36;
  const PDF_RENDER_JPEG_QUALITY = 0.96;
  const PDF_TILE_HEIGHT_RATIO = 1.25;
  const PDF_TILE_OVERLAP_RATIO = 0.16;
  const PDFJS_WORKER_SRC = "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js";
  const QUOTA_STORAGE_KEY = "gemini-study-quota-v1";
  const QUOTA_LIMITS = {
    "gemini-2.5-flash": { rpm: 10, tpm: 250000, rpd: 250 },
    "gemini-2.5-pro": { rpm: 5, tpm: 250000, rpd: 100 },
    "gemini-2.5-flash-lite": { rpm: 15, tpm: 250000, rpd: 1000 },
    "gemini-2.0-flash": { rpm: 15, tpm: 1000000, rpd: 200 },
    "gemini-2.0-flash-lite": { rpm: 30, tpm: 1000000, rpd: 200 }
  };

  const SYSTEM_INSTRUCTION = [
    "Bạn là trợ lý chuyên giải bài tập môn Thị giác máy tính từ ảnh, PDF và text.",
    "Khi người dùng chỉ gửi ảnh/PDF/text mà không ghi yêu cầu, hãy tự hiểu nhiệm vụ là đọc đề, nhận diện dữ kiện, công thức, hình vẽ, bảng biểu và giải bài Thị giác máy tính.",
    "Trước khi trả lời, hãy tự giải và kiểm tra nội bộ ít nhất 3 lượt độc lập: lượt 1 đọc đề và lập mô hình, lượt 2 giải lại bằng cách khác hoặc kiểm tra công thức, lượt 3 đối chiếu đơn vị, giả thiết, dấu, kích thước ma trận, xác suất hoặc kết quả số.",
    "Không hiển thị toàn bộ 3 bản nháp nội bộ. Sau khi kiểm tra xong, hãy hiển thị lời giải tóm tắt cho từng câu và tổng kết đáp án.",
    "Ưu tiên các chủ đề Thị giác máy tính: xử lý ảnh, convolution/filtering, histogram, edge detection, segmentation, morphology, camera model, calibration, homography, optical flow, feature matching, stereo vision, projection, xác suất/thống kê trong vision và deep learning cho ảnh.",
    "Cấu trúc câu trả lời bắt buộc gồm đúng 2 mục Markdown: \"## Lời giải tóm tắt\" và \"## Tổng kết đáp án\".",
    "Mỗi câu hỏi trong đề thường có mã riêng như #110df6, #110df7. Bắt buộc dùng đúng mã câu hỏi đọc được trong đề làm nhãn dòng; không tự đổi thành Câu 1/Câu 2 khi đề không có cách đánh số đó.",
    "Trong mục \"Lời giải tóm tắt\", trình bày từng câu theo mẫu: \"#110df6: ...\". Mỗi mã câu hỏi tóm tắt cách làm hoặc lý do chọn đáp án trong 1-3 câu ngắn, đủ để người học hiểu ý chính, không viết bản nháp dài.",
    "Trong mục \"Tổng kết đáp án\", liệt kê đáp án cuối cùng từng mã câu hỏi. Với trắc nghiệm ghi theo mẫu: \"#110df6: A - 22 đơn vị\" hoặc \"#110df7: B - 66 chữ số\". Với tự luận ghi kết quả cuối cùng thật ngắn gọn kèm đơn vị nếu có.",
    "Nếu không đọc được mã của một câu, dùng nhãn \"#khong-doc-duoc-ma-1\", \"#khong-doc-duoc-ma-2\" theo thứ tự xuất hiện và nói rõ mã bị mờ trong phần tóm tắt.",
    "Nếu bài yêu cầu code, trong \"Lời giải tóm tắt\" nêu ngắn ý tưởng chính; trong \"Tổng kết đáp án\" hiển thị khối code hoàn chỉnh hoặc đoạn code chính cần nộp.",
    "Nếu có hơn 20 câu, vẫn ưu tiên trả đủ tất cả câu; phần lời giải tóm tắt mỗi câu tối đa 1 câu.",
    "Với PDF dạng ảnh chụp/screencapture chữ nhỏ, hãy đọc cả ảnh toàn trang và các lát cắt phóng to được cung cấp trước khi kết luận thiếu dữ kiện.",
    "Chỉ nói ảnh/PDF mờ hoặc thiếu dữ kiện khi đã đọc kỹ các lát cắt phóng to nhưng vẫn không nhận diện được nội dung quan trọng.",
    "Luôn trả lời bằng Markdown hợp lệ, ưu tiên tiếng Việt, dùng LaTeX cho công thức toán, không bịa thông tin ngoài nội dung được cung cấp."
  ].join(" ");

  const state = {
    uiMessages: [],
    apiHistory: [],
    pendingFiles: [],
    busy: false,
    abortController: null,
    quota: loadQuota(),
    provider: loadProvider(),
    model: ""
  };
  let mathRenderQueue = Promise.resolve();

  const els = {
    clearChatButton: document.querySelector("#clearChatButton"),
    stopButton: document.querySelector("#stopButton"),
    messages: document.querySelector("#messages"),
    statusText: document.querySelector("#statusText"),
    chatForm: document.querySelector("#chatForm"),
    fileInput: document.querySelector("#fileInput"),
    attachButton: document.querySelector("#attachButton"),
    attachmentsList: document.querySelector("#attachmentsList"),
    promptInput: document.querySelector("#promptInput"),
    sendButton: document.querySelector("#sendButton"),
    providerSelect: document.querySelector("#providerSelect"),
    modelSelect: document.querySelector("#modelSelect"),
    openaiKeyField: document.querySelector("#openaiKeyField"),
    openaiApiKeyInput: document.querySelector("#openaiApiKeyInput"),
    toggleOpenaiKeyButton: document.querySelector("#toggleOpenaiKeyButton"),
    resetQuotaButton: document.querySelector("#resetQuotaButton"),
    quotaMeters: document.querySelector("#quotaMeters"),
    quotaModelText: document.querySelector("#quotaModelText"),
    quotaSummary: document.querySelector("#quotaSummary")
  };

  init();

  function init() {
    configureMarkdown();
    configurePdfRenderer();
    initModelControls();
    bindEvents();
    renderAttachments();
    renderMessages();
    renderQuota();
    refreshIcons();
    autoResizeTextarea();
    setStatus("Sẵn sàng");
  }

  function configureMarkdown() {
    if (!window.marked) return;
    window.marked.setOptions({
      breaks: true,
      gfm: true
    });
  }

  function configurePdfRenderer() {
    if (!window.pdfjsLib) return;
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_SRC;
  }

  function initModelControls() {
    els.providerSelect.value = state.provider;
    renderModelOptions();

    const savedModel = localStorage.getItem(MODEL_STORAGE_KEY) || "";
    const models = getProviderModels(state.provider);
    const fallbackModel = state.provider === "gemini" ? PRIMARY_MODEL : models[0]?.id;
    state.model = models.some((model) => model.id === savedModel) ? savedModel : fallbackModel;
    els.modelSelect.value = state.model;
    els.openaiApiKeyInput.value = localStorage.getItem(OPENAI_KEY_STORAGE_KEY) || "";
    syncOpenAIKeyField();
  }

  function setProvider(provider) {
    state.provider = getProviderModels(provider).length ? provider : DEFAULT_PROVIDER;
    localStorage.setItem(PROVIDER_STORAGE_KEY, state.provider);
    renderModelOptions();
    state.model = getProviderModels(state.provider)[0]?.id || PRIMARY_MODEL;
    els.modelSelect.value = state.model;
    localStorage.setItem(MODEL_STORAGE_KEY, state.model);
    syncOpenAIKeyField();
    renderQuota();
    setStatus(`Đã chọn ${getProviderLabel(state.provider)} · ${getSelectedModelLabel()}`);
  }

  function setModel(model) {
    const models = getProviderModels(state.provider);
    state.model = models.some((item) => item.id === model) ? model : models[0]?.id || PRIMARY_MODEL;
    els.modelSelect.value = state.model;
    localStorage.setItem(MODEL_STORAGE_KEY, state.model);
    renderQuota();
    setStatus(`Đã chọn ${getProviderLabel(state.provider)} · ${getSelectedModelLabel()}`);
  }

  function renderModelOptions() {
    els.modelSelect.innerHTML = getProviderModels(state.provider)
      .map((model) => `<option value="${escapeHtml(model.id)}">${escapeHtml(model.label)}</option>`)
      .join("");
  }

  function getProviderModels(provider) {
    return PROVIDER_MODELS[provider] || PROVIDER_MODELS[DEFAULT_PROVIDER];
  }

  function getSelectedModelOption() {
    return getProviderModels(state.provider).find((model) => model.id === state.model) || getProviderModels(state.provider)[0];
  }

  function getSelectedModelLabel() {
    return getSelectedModelOption()?.label || state.model || PRIMARY_MODEL;
  }

  function getApiModelId(modelOption) {
    return normalizeModel(modelOption?.model || modelOption?.id || PRIMARY_MODEL);
  }

  function getProviderLabel(provider) {
    return provider === "openai" ? "OpenAI" : "Gemini";
  }

  function syncOpenAIKeyField() {
    els.openaiKeyField.hidden = state.provider !== "openai";
  }

  function getOpenAIKey() {
    return els.openaiApiKeyInput.value.trim();
  }

  function bindEvents() {
    els.providerSelect.addEventListener("change", () => {
      setProvider(els.providerSelect.value);
    });
    els.modelSelect.addEventListener("change", () => {
      setModel(els.modelSelect.value);
    });
    els.openaiApiKeyInput.addEventListener("input", () => {
      localStorage.setItem(OPENAI_KEY_STORAGE_KEY, getOpenAIKey());
    });
    els.toggleOpenaiKeyButton.addEventListener("click", () => {
      const shouldShow = els.openaiApiKeyInput.type === "password";
      els.openaiApiKeyInput.type = shouldShow ? "text" : "password";
      els.toggleOpenaiKeyButton.innerHTML = iconSvg(shouldShow ? "eye-off" : "eye");
      refreshIcons();
    });

    els.attachButton.addEventListener("click", () => els.fileInput.click());
    els.fileInput.addEventListener("change", () => {
      addFiles(els.fileInput.files);
      els.fileInput.value = "";
    });

    els.chatForm.addEventListener("submit", handleSubmit);
    els.clearChatButton.addEventListener("click", clearChat);
    els.resetQuotaButton.addEventListener("click", resetQuota);
    els.stopButton.addEventListener("click", stopGeneration);

    els.promptInput.addEventListener("input", autoResizeTextarea);
    els.promptInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        els.chatForm.requestSubmit();
      }
    });

    ["dragenter", "dragover"].forEach((eventName) => {
      els.chatForm.addEventListener(eventName, (event) => {
        event.preventDefault();
        els.chatForm.classList.add("dragging");
      });
    });

    ["dragleave", "drop"].forEach((eventName) => {
      els.chatForm.addEventListener(eventName, (event) => {
        event.preventDefault();
        els.chatForm.classList.remove("dragging");
      });
    });

    els.chatForm.addEventListener("drop", (event) => {
      addFiles(event.dataTransfer.files);
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (state.busy) return;

    const prompt = els.promptInput.value.trim();
    const files = [...state.pendingFiles];
    if (!prompt && files.length === 0) return;

    setBusy(true);
    setStatus("Đang chuẩn bị dữ liệu");

    const userMessage = {
      id: createId(),
      role: "user",
      text: prompt,
      attachments: files.map((item) => ({
        name: item.file.name,
        kind: item.kind,
        size: item.file.size
      }))
    };

    addMessage(userMessage);
    clearComposer();

    const assistantMessage = {
      id: createId(),
      role: "assistant",
      text: "",
      streaming: true
    };
    addMessage(assistantMessage);

    state.abortController = new AbortController();

    try {
      const result = state.provider === "openai"
        ? await runOpenAIChat({
            prompt,
            files,
            messageId: assistantMessage.id,
            signal: state.abortController.signal
          })
        : await runGeminiChat({
            prompt,
            files,
            messageId: assistantMessage.id,
            signal: state.abortController.signal
          });

      if (result.provider === "gemini") {
        recordQuotaUsage(result.model, result.usage);
      }

      const finalText = result.answer.trim() || `Không nhận được nội dung trả lời từ ${getProviderLabel(result.provider)}.`;
      finalizeAssistantMessage(assistantMessage.id, finalText);
      pushTextHistory(prompt, files, finalText);
      setStatus("Hoàn tất");
    } catch (error) {
      if (error.name === "AbortError") {
        finalizeAssistantMessage(assistantMessage.id, "Đã dừng phản hồi.");
        setStatus("Đã dừng");
      } else {
        finalizeAssistantMessage(assistantMessage.id, `**Lỗi:** ${escapeMarkdown(error.message || String(error))}`);
        setStatus("Có lỗi xảy ra");
      }
    } finally {
      files.forEach((item) => revokePreview(item));
      setBusy(false);
      state.abortController = null;
      scrollToBottom();
    }
  }

  async function runGeminiChat({ prompt, files, messageId, signal }) {
    const userParts = await buildGeminiUserParts(prompt, files, signal);
    const requestHistory = buildGeminiRequestHistory(userParts);
    const selectedModel = getApiModelId(getSelectedModelOption());
    const modelsToTry = uniqueList([selectedModel, ...FALLBACK_MODELS]);

    setStatus("Đang kết nối Gemini");
    const result = await tryGeminiModels({
      models: modelsToTry,
      contents: requestHistory,
      messageId,
      signal
    });

    return { ...result, provider: "gemini" };
  }

  async function runOpenAIChat({ prompt, files, messageId, signal }) {
    const apiKey = getOpenAIKey();
    if (!apiKey) {
      throw new Error("Bạn cần nhập OpenAI API key ở cột bên trái trước khi dùng model OpenAI.");
    }

    const input = await buildOpenAIInput(prompt, files, signal);
    const modelOption = getSelectedModelOption();
    const model = getApiModelId(modelOption);

    setStatus("Đang kết nối OpenAI");
    let answer = "";
    let usage = null;

    await streamOpenAI({
      model,
      apiKey,
      payload: createOpenAIPayload(input, modelOption),
      signal,
      onDelta: (delta) => {
        if (!delta) return;
        answer += delta;
        updateStreamingMessage(messageId, answer);
      },
      onUsage: (metadata) => {
        usage = metadata;
      }
    });

    return { provider: "openai", model: modelOption.id, answer, usage };
  }

  async function tryGeminiModels({ models, contents, messageId, signal }) {
    let lastError = null;

    for (const model of models) {
      const cleanModel = normalizeModel(model);
      if (!cleanModel) continue;

      try {
        if (cleanModel !== PRIMARY_MODEL) {
          setStatus(`Fallback: ${cleanModel}`);
        }

        let answer = "";
        let usage = null;
        await streamGemini({
          model: cleanModel,
          payload: createPayload(contents, cleanModel),
          signal,
          onDelta: (delta) => {
            if (!delta) return;
            answer += delta;
            updateStreamingMessage(messageId, answer);
          },
          onUsage: (metadata) => {
            usage = metadata;
          }
        });

        return { answer, model: cleanModel, usage };
      } catch (error) {
        lastError = error;
        if (signal.aborted || !shouldFallback(error)) break;
      }
    }

    throw lastError || new Error("Không gọi được Gemini API.");
  }

  function createPayload(contents, model) {
    const generationConfig = {
      temperature: TEMPERATURE,
      topP: 0.95,
      maxOutputTokens: 4096
    };

    if (isGemini3(model)) {
      generationConfig.thinkingConfig = { thinkingLevel: "medium" };
    } else if (/2\.5-pro/i.test(model)) {
      generationConfig.thinkingConfig = { thinkingBudget: -1 };
    } else if (/flash-lite/i.test(model)) {
      generationConfig.thinkingConfig = { thinkingBudget: 2048 };
    } else if (isFlashModel(model)) {
      generationConfig.thinkingConfig = { thinkingBudget: THINKING_BUDGET };
    }

    return {
      system_instruction: {
        parts: [{ text: SYSTEM_INSTRUCTION }]
      },
      contents,
      generationConfig
    };
  }

  function createOpenAIPayload(input, modelOption) {
    const model = getApiModelId(modelOption);
    const payload = {
      model,
      instructions: SYSTEM_INSTRUCTION,
      input,
      stream: true,
      max_output_tokens: 4096
    };

    if (modelOption?.reasoningEffort) {
      payload.reasoning = { effort: modelOption.reasoningEffort };
    } else if (/^gpt-5/i.test(model)) {
      payload.reasoning = { effort: "low" };
    }

    return payload;
  }

  async function streamGemini({ model, payload, signal, onDelta, onUsage }) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY
      },
      body: JSON.stringify(payload),
      signal
    });

    if (!response.ok) {
      throw await createApiError(response);
    }

    if (!response.body) {
      const data = await response.json();
      onDelta(extractAnswerText(data));
      onUsage?.(extractUsageMetadata(data));
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let sawContent = false;

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split(/\r?\n\r?\n/);
      buffer = events.pop() || "";

      for (const eventText of events) {
        const { delta, usage } = parseSseEvent(eventText);
        if (usage) onUsage?.(usage);
        if (delta) {
          sawContent = true;
          onDelta(delta);
        }
      }
    }

    if (buffer.trim()) {
      const { delta, usage } = parseSseEvent(buffer);
      if (usage) onUsage?.(usage);
      if (delta) {
        sawContent = true;
        onDelta(delta);
      }
    }

    if (!sawContent) {
      setStatus("Gemini không trả về text");
    }
  }

  async function streamOpenAI({ apiKey, payload, signal, onDelta, onUsage }) {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload),
      signal
    });

    if (!response.ok) {
      throw await createApiError(response);
    }

    if (!response.body) {
      const data = await response.json();
      onDelta(extractOpenAIText(data));
      onUsage?.(extractOpenAIUsage(data));
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let sawContent = false;

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split(/\r?\n\r?\n/);
      buffer = events.pop() || "";

      for (const eventText of events) {
        const { delta, usage, error } = parseOpenAISseEvent(eventText);
        if (error) throw error;
        if (usage) onUsage?.(usage);
        if (delta) {
          sawContent = true;
          onDelta(delta);
        }
      }
    }

    if (buffer.trim()) {
      const { delta, usage, error } = parseOpenAISseEvent(buffer);
      if (error) throw error;
      if (usage) onUsage?.(usage);
      if (delta) {
        sawContent = true;
        onDelta(delta);
      }
    }

    if (!sawContent) {
      setStatus("OpenAI không trả về text");
    }
  }

  function parseSseEvent(eventText) {
    const data = eventText
      .split(/\r?\n/)
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trim())
      .join("\n");

    if (!data || data === "[DONE]") return { delta: "", usage: null };

    try {
      const parsed = JSON.parse(data);
      return {
        delta: extractAnswerText(parsed),
        usage: extractUsageMetadata(parsed)
      };
    } catch {
      return { delta: "", usage: null };
    }
  }

  function parseOpenAISseEvent(eventText) {
    const data = eventText
      .split(/\r?\n/)
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trim())
      .join("\n");

    if (!data || data === "[DONE]") return { delta: "", usage: null, error: null };

    try {
      const parsed = JSON.parse(data);

      if (parsed.type === "error" || parsed.error) {
        return {
          delta: "",
          usage: null,
          error: new Error(parsed.error?.message || parsed.message || "OpenAI API trả về lỗi.")
        };
      }

      if (parsed.type === "response.output_text.delta") {
        return { delta: parsed.delta || "", usage: null, error: null };
      }

      if (parsed.type === "response.completed") {
        return {
          delta: "",
          usage: extractOpenAIUsage(parsed.response),
          error: null
        };
      }

      return { delta: "", usage: extractOpenAIUsage(parsed.response || parsed), error: null };
    } catch {
      return { delta: "", usage: null, error: null };
    }
  }

  function extractAnswerText(data) {
    const parts = data?.candidates?.flatMap((candidate) => candidate?.content?.parts || []) || [];
    return parts
      .filter((part) => !part.thought && typeof part.text === "string")
      .map((part) => part.text)
      .join("");
  }

  function extractUsageMetadata(data) {
    const metadata = data?.usageMetadata;
    if (!metadata) return null;

    return {
      promptTokenCount: Number(metadata.promptTokenCount || 0),
      candidatesTokenCount: Number(metadata.candidatesTokenCount || 0),
      thoughtsTokenCount: Number(metadata.thoughtsTokenCount || 0),
      totalTokenCount: Number(metadata.totalTokenCount || 0)
    };
  }

  function extractOpenAIText(data) {
    if (typeof data?.output_text === "string") return data.output_text;

    const output = Array.isArray(data?.output) ? data.output : [];
    return output
      .flatMap((item) => Array.isArray(item.content) ? item.content : [])
      .filter((content) => content.type === "output_text" && typeof content.text === "string")
      .map((content) => content.text)
      .join("");
  }

  function extractOpenAIUsage(data) {
    const usage = data?.usage;
    if (!usage) return null;

    return {
      promptTokenCount: Number(usage.input_tokens || 0),
      candidatesTokenCount: Number(usage.output_tokens || 0),
      totalTokenCount: Number(usage.total_tokens || 0)
    };
  }

  async function createApiError(response) {
    let message = `${response.status} ${response.statusText}`;

    try {
      const data = await response.json();
      message = data?.error?.message || message;
    } catch {
      try {
        message = (await response.text()) || message;
      } catch {
        // Keep the status message.
      }
    }

    const error = new Error(message);
    error.status = response.status;
    return error;
  }

  function shouldFallback(error) {
    const message = String(error.message || "").toLowerCase();
    return error.status === 404 || (error.status === 400 && message.includes("model"));
  }

  async function buildOpenAIInput(prompt, files, signal) {
    const totalFileBytes = files.reduce((total, item) => total + item.file.size, 0);
    assertTurnLimit(totalFileBytes);

    const input = state.apiHistory
      .slice(-MAX_HISTORY_MESSAGES)
      .map(toOpenAIHistoryMessage)
      .filter(Boolean);

    const content = [];
    const attachmentLine = files.length
      ? `Tệp đính kèm: ${files.map((item) => `${item.file.name} (${item.kind})`).join(", ")}.`
      : "";
    const finalPrompt = prompt || "Hãy đọc đề trong tệp đính kèm và giải như một bài Thị giác máy tính.";

    content.push({
      type: "input_text",
      text: [
        attachmentLine,
        finalPrompt,
        "Hãy tự giải/kiểm tra nội bộ ít nhất 3 lượt trước khi trả lời.",
        "Chỉ hiển thị đúng 2 mục Markdown: \"## Lời giải tóm tắt\" và \"## Tổng kết đáp án\".",
        "Dùng mã câu hỏi trong đề làm nhãn dòng, ví dụ \"#110df6: ...\"; không tự đổi thành Câu 1/Câu 2 nếu đề không có nhãn đó.",
        "Trong \"Lời giải tóm tắt\", mỗi mã câu hỏi ghi 1-3 câu ngắn về cách làm/lý do chọn. Trong \"Tổng kết đáp án\", liệt kê đáp án cuối cùng từng mã thật gọn."
      ].filter(Boolean).join("\n\n")
    });

    for (const item of files) {
      const mimeType = getMimeType(item.file, item.kind);

      if (item.kind === "text" && item.file.size <= MAX_TEXT_INLINE_BYTES) {
        const text = await readTextFile(item.file);
        content.push({
          type: "input_text",
          text: `File text "${item.file.name}":\n\n${truncateText(text, MAX_TEXT_INLINE_BYTES)}`
        });
        continue;
      }

      if (item.kind === "pdf") {
        const renderedPages = await renderPdfPages(item.file, signal);
        for (const page of renderedPages) {
          content.push({
            type: "input_text",
            text: `${page.label} của PDF "${item.file.name}" đã được render thành ảnh độ phân giải cao để đọc chữ nhỏ.`
          });
          content.push({
            type: "input_image",
            image_url: page.dataUrl,
            detail: "high"
          });
        }
        continue;
      }

      if (item.file.size > INLINE_FILE_BYTES) {
        throw new Error(`OpenAI chỉ gửi inline file tối đa ${formatBytes(INLINE_FILE_BYTES)} trong app tĩnh này. Hãy chọn Gemini cho file lớn hoặc giảm dung lượng file "${item.file.name}".`);
      }

      if (item.kind === "image") {
        content.push({
          type: "input_image",
          image_url: await blobToDataUrl(item.file)
        });
        continue;
      }

    }

    input.push({ role: "user", content });
    return input;
  }

  function toOpenAIHistoryMessage(message) {
    const role = message.role === "model" ? "assistant" : message.role;
    if (role !== "user" && role !== "assistant") return null;

    const text = (message.parts || [])
      .map((part) => part.text)
      .filter(Boolean)
      .join("\n\n");

    if (!text) return null;

    return {
      role,
      content: [
        {
          type: role === "assistant" ? "output_text" : "input_text",
          text
        }
      ]
    };
  }

  async function buildGeminiUserParts(prompt, files, signal) {
    const parts = [];
    const totalFileBytes = files.reduce((total, item) => total + item.file.size, 0);
    const preferUpload = totalFileBytes > INLINE_FILE_BYTES;
    assertTurnLimit(totalFileBytes);

    for (const item of files) {
      const mimeType = getMimeType(item.file, item.kind);

      if (item.kind === "text" && item.file.size <= MAX_TEXT_INLINE_BYTES) {
        const text = await readTextFile(item.file);
        parts.push({
          text: `File text "${item.file.name}":\n\n${truncateText(text, MAX_TEXT_INLINE_BYTES)}`
        });
        continue;
      }

      if (item.kind === "pdf") {
        const renderedPages = await renderPdfPages(item.file, signal);
        for (const page of renderedPages) {
          parts.push({
            text: `${page.label} của PDF "${item.file.name}" đã được render thành ảnh độ phân giải cao để đọc chữ nhỏ.`
          });
          parts.push({
            inline_data: {
              mime_type: "image/jpeg",
              data: page.base64
            }
          });
        }
        continue;
      }

      if (!preferUpload && item.file.size <= INLINE_FILE_BYTES) {
        parts.push({
          inline_data: {
            mime_type: mimeType,
            data: await blobToBase64(item.file)
          }
        });
        continue;
      }

      parts.push(await uploadFilePart(item.file, mimeType, signal));
    }

    const attachmentLine = files.length
      ? `Tệp đính kèm: ${files.map((item) => `${item.file.name} (${item.kind})`).join(", ")}.`
      : "";
    const finalPrompt = prompt || "Hãy đọc đề trong tệp đính kèm và giải như một bài Thị giác máy tính.";

    parts.push({
      text: [
        attachmentLine,
        finalPrompt,
        "Hãy tự giải/kiểm tra nội bộ ít nhất 3 lượt trước khi trả lời.",
        "Chỉ hiển thị đúng 2 mục Markdown: \"## Lời giải tóm tắt\" và \"## Tổng kết đáp án\".",
        "Dùng mã câu hỏi trong đề làm nhãn dòng, ví dụ \"#110df6: ...\"; không tự đổi thành Câu 1/Câu 2 nếu đề không có nhãn đó.",
        "Trong \"Lời giải tóm tắt\", mỗi mã câu hỏi ghi 1-3 câu ngắn về cách làm/lý do chọn. Trong \"Tổng kết đáp án\", liệt kê đáp án cuối cùng từng mã thật gọn."
      ].filter(Boolean).join("\n\n")
    });

    return parts;
  }

  function buildGeminiRequestHistory(currentUserParts) {
    const recentHistory = state.apiHistory.slice(-MAX_HISTORY_MESSAGES);
    return [
      ...recentHistory,
      {
        role: "user",
        parts: currentUserParts
      }
    ];
  }

  function pushTextHistory(prompt, files, answer) {
    const fileSummary = files.length
      ? `Tệp đã gửi trong lượt này: ${files.map((item) => `${item.file.name} (${item.kind}, ${formatBytes(item.file.size)})`).join(", ")}.`
      : "";
    const userText = [fileSummary, prompt || "Người dùng gửi tệp và yêu cầu phân tích."].filter(Boolean).join("\n");

    state.apiHistory.push({ role: "user", parts: [{ text: userText }] });
    state.apiHistory.push({ role: "model", parts: [{ text: answer }] });

    if (state.apiHistory.length > MAX_HISTORY_MESSAGES) {
      state.apiHistory = state.apiHistory.slice(-MAX_HISTORY_MESSAGES);
    }
  }

  async function uploadFilePart(file, mimeType, signal) {
    const uploaded = await uploadGeminiFile(file, mimeType, signal);
    const readyFile = await waitForFileReady(uploaded, signal);
    const fileUri = readyFile.uri || uploaded.uri;
    const fileMimeType = readyFile.mimeType || uploaded.mimeType || mimeType;

    if (!fileUri) {
      throw new Error(`Upload file "${file.name}" xong nhưng Gemini không trả về file URI.`);
    }

    return {
      file_data: {
        mime_type: fileMimeType,
        file_uri: fileUri
      }
    };
  }

  async function uploadGeminiFile(file, mimeType, signal) {
    setStatus(`Đang upload ${file.name} (${formatBytes(file.size)})`);

    const startResponse = await fetch(`https://generativelanguage.googleapis.com/upload/v1beta/files?key=${encodeURIComponent(GEMINI_API_KEY)}`, {
      method: "POST",
      headers: {
        "X-Goog-Upload-Protocol": "resumable",
        "X-Goog-Upload-Command": "start",
        "X-Goog-Upload-Header-Content-Length": String(file.size),
        "X-Goog-Upload-Header-Content-Type": mimeType,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        file: {
          display_name: file.name
        }
      }),
      signal
    });

    if (!startResponse.ok) {
      throw await createApiError(startResponse);
    }

    const uploadUrl = startResponse.headers.get("x-goog-upload-url");
    if (!uploadUrl) {
      throw new Error("Không lấy được upload URL từ Gemini Files API.");
    }

    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        "X-Goog-Upload-Offset": "0",
        "X-Goog-Upload-Command": "upload, finalize"
      },
      body: file,
      signal
    });

    if (!uploadResponse.ok) {
      throw await createApiError(uploadResponse);
    }

    const data = await uploadResponse.json();
    return data.file || data;
  }

  async function waitForFileReady(file, signal) {
    if (!file?.name || !isProcessingFileState(file.state)) {
      if (file?.state === "FAILED") {
        throw new Error(`Gemini xử lý file thất bại: ${file.name}`);
      }
      return file;
    }

    const startedAt = Date.now();
    let current = file;

    while (isProcessingFileState(current.state)) {
      if (Date.now() - startedAt > FILE_PROCESS_TIMEOUT_MS) {
        throw new Error(`Gemini xử lý file quá lâu: ${file.name}`);
      }

      setStatus(`Đang xử lý file ${file.name}`);
      await delay(FILE_PROCESS_POLL_MS, signal);

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/${current.name}?key=${encodeURIComponent(GEMINI_API_KEY)}`, {
        signal
      });

      if (!response.ok) {
        throw await createApiError(response);
      }

      const data = await response.json();
      current = data.file || data;
    }

    if (current.state === "FAILED") {
      throw new Error(`Gemini xử lý file thất bại: ${file.name}`);
    }

    return current;
  }

  function isProcessingFileState(stateValue) {
    return stateValue === "PROCESSING" || stateValue === "STATE_UNSPECIFIED" || stateValue === "FILE_STATE_UNSPECIFIED";
  }

  function delay(ms, signal) {
    return new Promise((resolve, reject) => {
      if (signal?.aborted) {
        reject(new DOMException("Aborted", "AbortError"));
        return;
      }

      const timer = setTimeout(resolve, ms);
      signal?.addEventListener("abort", () => {
        clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      }, { once: true });
    });
  }

  function assertTurnLimit(totalBytes) {
    if (totalBytes > MAX_TURN_BYTES) {
      throw new Error(`Tổng dung lượng file quá lớn. Giới hạn hiện tại là ${formatBytes(MAX_TURN_BYTES)} mỗi lượt.`);
    }
  }

  function addFiles(fileList) {
    const incoming = [...fileList];
    for (const file of incoming) {
      if (state.pendingFiles.length >= MAX_ATTACHMENTS) {
        setStatus(`Tối đa ${MAX_ATTACHMENTS} tệp mỗi lượt`);
        break;
      }

      const kind = detectFileKind(file);
      if (!kind) {
        setStatus(`Bỏ qua: ${file.name}`);
        continue;
      }

      const nextTurnBytes = getPendingFilesSize() + file.size;
      if (nextTurnBytes > MAX_TURN_BYTES) {
        setStatus(`Vượt giới hạn ${formatBytes(MAX_TURN_BYTES)}/lượt`);
        continue;
      }

      state.pendingFiles.push({
        id: createId(),
        file,
        kind,
        previewUrl: kind === "image" ? URL.createObjectURL(file) : ""
      });
    }

    renderAttachments();
  }

  function getPendingFilesSize() {
    return state.pendingFiles.reduce((total, item) => total + item.file.size, 0);
  }

  function detectFileKind(file) {
    const name = file.name.toLowerCase();
    if (file.type.startsWith("image/")) return "image";
    if (file.type === "application/pdf" || name.endsWith(".pdf")) return "pdf";
    if (file.type.startsWith("text/") || /\.(txt|md|csv|json)$/i.test(name)) return "text";
    return "";
  }

  function getMimeType(file, kind) {
    if (file.type) return file.type;
    if (kind === "pdf") return "application/pdf";
    if (kind === "text") return "text/plain";
    if (kind === "image") return "image/jpeg";
    return "application/octet-stream";
  }

  function renderAttachments() {
    els.attachmentsList.innerHTML = "";

    for (const item of state.pendingFiles) {
      const chip = document.createElement("div");
      chip.className = "attachment-chip";

      const preview = document.createElement(item.previewUrl ? "img" : "div");
      preview.className = "attachment-thumb";
      if (item.previewUrl) {
        preview.src = item.previewUrl;
        preview.alt = "";
      } else {
        preview.innerHTML = iconSvg(item.kind === "pdf" ? "file-text" : "file");
      }

      const name = document.createElement("div");
      name.className = "attachment-name";
      name.innerHTML = `<strong>${escapeHtml(item.file.name)}</strong><span>${item.kind.toUpperCase()} · ${formatBytes(item.file.size)}</span>`;

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "remove-file";
      remove.title = "Gỡ file";
      remove.setAttribute("aria-label", `Gỡ ${item.file.name}`);
      remove.innerHTML = iconSvg("x");
      remove.addEventListener("click", () => removeAttachment(item.id));

      chip.append(preview, name, remove);
      els.attachmentsList.append(chip);
    }

    refreshIcons();
  }

  function removeAttachment(id) {
    const item = state.pendingFiles.find((file) => file.id === id);
    if (item) revokePreview(item);
    state.pendingFiles = state.pendingFiles.filter((file) => file.id !== id);
    renderAttachments();
  }

  function revokePreview(item) {
    if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
  }

  function clearComposer() {
    els.promptInput.value = "";
    state.pendingFiles = [];
    els.attachmentsList.innerHTML = "";
    autoResizeTextarea();
  }

  function clearChat() {
    if (state.busy) stopGeneration();
    state.uiMessages = [];
    state.apiHistory = [];
    renderMessages();
    setStatus("Đã xóa chat");
  }

  function resetQuota() {
    state.quota = createEmptyQuota();
    saveQuota();
    renderQuota();
    setStatus("Đã đặt lại bộ đếm quota");
  }

  function stopGeneration() {
    state.abortController?.abort();
  }

  function addMessage(message) {
    state.uiMessages.push(message);
    renderMessages();
    scrollToBottom();
  }

  function renderMessages() {
    if (state.uiMessages.length === 0) {
      els.messages.innerHTML = `
        <div class="empty-state">
          <i data-lucide="sparkles"></i>
          <p>Gửi ảnh/PDF/text bài Thị giác máy tính để bắt đầu.</p>
        </div>
      `;
      refreshIcons();
      return;
    }

    els.messages.innerHTML = "";
    for (const message of state.uiMessages) {
      els.messages.append(createMessageElement(message));
    }
    refreshIcons();
    enhanceCodeBlocks(els.messages);
    renderMath(els.messages);
  }

  function createMessageElement(message) {
    const article = document.createElement("article");
    article.className = `message ${message.role}`;
    article.dataset.messageId = message.id;

    const avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.innerHTML = iconSvg(message.role === "user" ? "user" : "bot");

    const bubble = document.createElement("div");
    bubble.className = "bubble";

    if (message.role === "assistant") {
      const content = document.createElement("div");
      content.className = `markdown${message.streaming ? " streaming" : ""}`;
      if (message.streaming) {
        content.textContent = message.text || "Đang trả lời...";
      } else {
        content.innerHTML = renderMarkdown(message.text);
      }
      bubble.append(content);
    } else {
      if (message.text) {
        const text = document.createElement("div");
        text.className = "message-text";
        text.textContent = message.text;
        bubble.append(text);
      }

      if (message.attachments?.length) {
        const files = document.createElement("div");
        files.className = "message-files";
        files.innerHTML = message.attachments
          .map((file) => {
            const icon = file.kind === "pdf" ? "file-text" : file.kind === "image" ? "image" : "file";
            return `<span class="file-pill">${iconSvg(icon)}<span>${escapeHtml(file.name)}</span></span>`;
          })
          .join("");
        bubble.append(files);
      }
    }

    article.append(avatar, bubble);
    return article;
  }

  function updateStreamingMessage(id, text) {
    const message = state.uiMessages.find((item) => item.id === id);
    if (message) message.text = text;

    const content = document.querySelector(`[data-message-id="${id}"] .markdown`);
    if (content) {
      content.classList.add("streaming");
      content.textContent = text || "Đang trả lời...";
    }
    scrollToBottom();
  }

  function finalizeAssistantMessage(id, text) {
    const message = state.uiMessages.find((item) => item.id === id);
    if (message) {
      message.text = text;
      message.streaming = false;
    }

    const content = document.querySelector(`[data-message-id="${id}"] .markdown`);
    if (content) {
      content.classList.remove("streaming");
      content.innerHTML = renderMarkdown(text);
      enhanceCodeBlocks(content);
      renderMath(content);
    }
    refreshIcons();
  }

  function renderMarkdown(markdown) {
    if (!window.marked || !window.DOMPurify) {
      return escapeHtml(markdown).replace(/\n/g, "<br>");
    }
    return window.DOMPurify.sanitize(window.marked.parse(markdown || ""));
  }

  function enhanceCodeBlocks(root) {
    root.querySelectorAll("pre").forEach((pre) => {
      if (pre.querySelector(".copy-code")) return;
      const code = pre.querySelector("code");
      if (!code) return;

      const button = document.createElement("button");
      button.type = "button";
      button.className = "copy-code";
      button.textContent = "Copy";
      button.addEventListener("click", async () => {
        await navigator.clipboard.writeText(code.textContent || "");
        button.textContent = "Copied";
        setTimeout(() => {
          button.textContent = "Copy";
        }, 1200);
      });
      pre.append(button);
    });
  }

  function renderMath(root) {
    if (!window.MathJax?.typesetPromise) return;

    mathRenderQueue = mathRenderQueue
      .then(() => {
        window.MathJax.typesetClear?.([root]);
        return window.MathJax.typesetPromise([root]);
      })
      .catch((error) => {
        console.warn("Math render failed", error);
      });
  }

  function setBusy(isBusy) {
    state.busy = isBusy;
    els.sendButton.setAttribute("aria-busy", String(isBusy));
    els.sendButton.disabled = isBusy;
    els.attachButton.disabled = isBusy;
    els.clearChatButton.disabled = isBusy;
    els.providerSelect.disabled = isBusy;
    els.modelSelect.disabled = isBusy;
    els.openaiApiKeyInput.disabled = isBusy;
    els.toggleOpenaiKeyButton.disabled = isBusy;
    els.stopButton.disabled = !isBusy;
  }

  function loadProvider() {
    const savedProvider = localStorage.getItem(PROVIDER_STORAGE_KEY);
    return getProviderModels(savedProvider).length ? savedProvider : DEFAULT_PROVIDER;
  }

  function loadQuota() {
    const empty = createEmptyQuota();

    try {
      const parsed = JSON.parse(localStorage.getItem(QUOTA_STORAGE_KEY) || "null");
      if (!parsed || typeof parsed !== "object") return empty;

      return {
        dayKey: parsed.dayKey || empty.dayKey,
        requests: Array.isArray(parsed.requests) ? parsed.requests : [],
        dailyByModel: parsed.dailyByModel && typeof parsed.dailyByModel === "object" ? parsed.dailyByModel : {}
      };
    } catch {
      return empty;
    }
  }

  function createEmptyQuota() {
    return {
      dayKey: getPacificDateKey(new Date()),
      requests: [],
      dailyByModel: {}
    };
  }

  function saveQuota() {
    localStorage.setItem(QUOTA_STORAGE_KEY, JSON.stringify(state.quota));
  }

  function recordQuotaUsage(model, usage) {
    const cleanModel = normalizeModel(model) || PRIMARY_MODEL;
    refreshQuotaWindow();

    const now = Date.now();
    const promptTokens = Number(usage?.promptTokenCount || 0);
    const totalTokens = Number(usage?.totalTokenCount || 0);

    state.quota.requests.push({
      at: now,
      model: cleanModel,
      promptTokens
    });

    const daily = getDailyQuotaBucket(cleanModel);
    daily.requests += 1;
    daily.promptTokens += promptTokens;
    daily.totalTokens += totalTokens;

    pruneMinuteRequests();
    saveQuota();
    renderQuota();
  }

  function refreshQuotaWindow() {
    const today = getPacificDateKey(new Date());
    if (state.quota.dayKey !== today) {
      state.quota.dayKey = today;
      state.quota.dailyByModel = {};
    }
    pruneMinuteRequests();
  }

  function pruneMinuteRequests() {
    const cutoff = Date.now() - 60000;
    state.quota.requests = state.quota.requests.filter((request) => request.at >= cutoff);
  }

  function getDailyQuotaBucket(model) {
    if (!state.quota.dailyByModel[model]) {
      state.quota.dailyByModel[model] = {
        requests: 0,
        promptTokens: 0,
        totalTokens: 0
      };
    }
    return state.quota.dailyByModel[model];
  }

  function renderQuota() {
    refreshQuotaWindow();

    if (state.provider === "openai") {
      const modelOption = getSelectedModelOption();
      const apiModel = getApiModelId(modelOption);
      const reasoningText = modelOption?.reasoningEffort ? ` · thinking ${modelOption.reasoningEffort}` : "";
      els.quotaModelText.textContent = `${modelOption?.label || apiModel} · ${apiModel}${reasoningText}`;
      els.quotaMeters.innerHTML = "";
      els.quotaSummary.textContent = "OpenAI tính usage trên dashboard; app này không áp quota local.";
      return;
    }

    const model = getApiModelId(getSelectedModelOption());
    const limits = QUOTA_LIMITS[model];
    if (!limits) {
      els.quotaModelText.textContent = `${model} · Gemini`;
      els.quotaMeters.innerHTML = "";
      els.quotaSummary.textContent = "Chưa có cấu hình quota local cho model này.";
      return;
    }
    const daily = getDailyQuotaBucket(model);
    const recent = state.quota.requests.filter((request) => request.model === model);
    const minuteRequests = recent.length;
    const minutePromptTokens = recent.reduce((total, request) => total + Number(request.promptTokens || 0), 0);
    const rows = [
      {
        label: "Lượt/phút",
        used: minuteRequests,
        limit: limits.rpm,
        suffix: "RPM"
      },
      {
        label: "Token nhập/phút",
        used: minutePromptTokens,
        limit: limits.tpm,
        suffix: "TPM"
      },
      {
        label: "Lượt/ngày",
        used: daily.requests,
        limit: limits.rpd,
        suffix: "RPD"
      }
    ];

    els.quotaModelText.textContent = `${model} · Free Tier`;
    els.quotaMeters.innerHTML = rows.map(renderQuotaMeter).join("");
    els.quotaSummary.textContent = `${formatNumber(daily.totalTokens)} token đã dùng hôm nay trong app này`;
  }

  function renderQuotaMeter(row) {
    const used = Math.max(0, row.used);
    const limit = Math.max(1, row.limit);
    const usedPercent = clamp((used / limit) * 100, 0, 100);
    const remaining = Math.max(0, limit - used);
    const remainingPercent = clamp(100 - usedPercent, 0, 100);

    return `
      <div class="quota-meter">
        <div class="quota-row">
          <span>${escapeHtml(row.label)}</span>
          <strong>${remainingPercent.toFixed(0)}% còn</strong>
        </div>
        <div class="quota-bar" aria-hidden="true">
          <span style="width: ${usedPercent.toFixed(2)}%"></span>
        </div>
        <div class="quota-numbers">
          <span>${formatNumber(used)} / ${formatNumber(limit)} ${escapeHtml(row.suffix)}</span>
          <span>còn ${formatNumber(remaining)}</span>
        </div>
      </div>
    `;
  }

  function getPacificDateKey(date) {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Los_Angeles",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(date);
  }

  function setStatus(message) {
    els.statusText.textContent = message;
  }

  function autoResizeTextarea() {
    els.promptInput.style.height = "auto";
    els.promptInput.style.height = `${Math.min(els.promptInput.scrollHeight, 170)}px`;
  }

  function scrollToBottom() {
    requestAnimationFrame(() => {
      els.messages.scrollTop = els.messages.scrollHeight;
    });
  }

  function readTextFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(reader.error || new Error("Không đọc được file text."));
      reader.readAsText(file);
    });
  }

  async function renderPdfPages(file, signal) {
    if (!window.pdfjsLib) {
      throw new Error("Chưa tải được PDF renderer. Hãy kiểm tra mạng/CDN rồi tải lại trang.");
    }

    setStatus(`Đang render PDF ${file.name}`);
    const data = await readArrayBuffer(file);
    throwIfAborted(signal);

    const loadingTask = window.pdfjsLib.getDocument({ data });
    signal?.addEventListener("abort", () => loadingTask.destroy(), { once: true });

    const pdf = await loadingTask.promise;
    const totalPages = pdf.numPages;
    const pageCount = Math.min(totalPages, PDF_RENDER_MAX_PAGES);
    const pages = [];

    for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
      if (pages.length >= PDF_RENDER_MAX_IMAGES) break;
      throwIfAborted(signal);
      setStatus(`Đang render PDF trang ${pageNumber}/${totalPages}`);

      const page = await pdf.getPage(pageNumber);
      const baseViewport = page.getViewport({ scale: 1 });
      const scale = Math.min(PDF_RENDER_MAX_SCALE, Math.max(1, PDF_RENDER_TARGET_WIDTH / baseViewport.width));
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d", { alpha: false });

      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);

      await page.render({
        canvasContext: context,
        viewport
      }).promise;

      const dataUrl = canvasToJpegDataUrl(canvas);
      pages.push({
        pageNumber,
        totalPages,
        dataUrl,
        base64: dataUrl.split(",").pop() || "",
        label: `Trang ${pageNumber}/${totalPages} - toàn trang`
      });

      const remainingSlots = PDF_RENDER_MAX_IMAGES - pages.length;
      if (remainingSlots > 0) {
        pages.push(...createPdfPageTiles(canvas, {
          pageNumber,
          totalPages,
          maxTiles: remainingSlots,
          signal
        }));
      }

      page.cleanup?.();
      canvas.width = 0;
      canvas.height = 0;
    }

    if (totalPages > pageCount) {
      pages.push({
        pageNumber: pageCount,
        totalPages,
        dataUrl: "",
        base64: "",
        truncated: true
      });
    }

    await pdf.destroy?.();
    return pages.filter((page) => !page.truncated);
  }

  function createPdfPageTiles(sourceCanvas, { pageNumber, totalPages, maxTiles, signal }) {
    const tileHeight = Math.round(sourceCanvas.width * PDF_TILE_HEIGHT_RATIO);
    if (sourceCanvas.height <= tileHeight * 1.25) return [];

    const overlap = Math.round(tileHeight * PDF_TILE_OVERLAP_RATIO);
    const step = Math.max(1, tileHeight - overlap);
    const tiles = [];

    for (let y = 0; y < sourceCanvas.height && tiles.length < maxTiles; y += step) {
      throwIfAborted(signal);
      const height = Math.min(tileHeight, sourceCanvas.height - y);
      if (height < sourceCanvas.height * 0.08) break;

      const tileCanvas = document.createElement("canvas");
      const tileContext = tileCanvas.getContext("2d", { alpha: false });
      tileCanvas.width = sourceCanvas.width;
      tileCanvas.height = height;
      tileContext.fillStyle = "#ffffff";
      tileContext.fillRect(0, 0, tileCanvas.width, tileCanvas.height);
      tileContext.drawImage(
        sourceCanvas,
        0,
        y,
        sourceCanvas.width,
        height,
        0,
        0,
        tileCanvas.width,
        tileCanvas.height
      );

      const dataUrl = canvasToJpegDataUrl(tileCanvas);
      tiles.push({
        pageNumber,
        totalPages,
        dataUrl,
        base64: dataUrl.split(",").pop() || "",
        label: `Trang ${pageNumber}/${totalPages} - lát ${tiles.length + 1}`
      });

      tileCanvas.width = 0;
      tileCanvas.height = 0;
      if (y + height >= sourceCanvas.height) break;
    }

    return tiles;
  }

  function canvasToJpegDataUrl(canvas) {
    return canvas.toDataURL("image/jpeg", PDF_RENDER_JPEG_QUALITY);
  }

  function readArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error || new Error("Không đọc được PDF."));
      reader.readAsArrayBuffer(file);
    });
  }

  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = String(reader.result || "");
        resolve(result.includes(",") ? result.split(",").pop() : result);
      };
      reader.onerror = () => reject(reader.error || new Error("Không đọc được file."));
      reader.readAsDataURL(blob);
    });
  }

  function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(reader.error || new Error("Không đọc được file."));
      reader.readAsDataURL(blob);
    });
  }

  function truncateText(text, maxBytes) {
    const encoder = new TextEncoder();
    if (encoder.encode(text).length <= maxBytes) return text;
    let output = text.slice(0, Math.floor(maxBytes / 2));
    while (encoder.encode(output).length > maxBytes) {
      output = output.slice(0, -1024);
    }
    return `${output}\n\n[Đã cắt bớt để tối ưu tốc độ]`;
  }

  function normalizeModel(model) {
    return String(model || "").trim().replace(/^models\//, "");
  }

  function isGemini3(model) {
    return /^gemini-3/i.test(model);
  }

  function isFlashModel(model) {
    return /flash/i.test(model);
  }

  function uniqueList(items) {
    return [...new Set(items.map(normalizeModel).filter(Boolean))];
  }

  function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    const units = ["KB", "MB", "GB"];
    let value = bytes / 1024;
    let unitIndex = 0;
    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex += 1;
    }
    return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unitIndex]}`;
  }

  function formatNumber(value) {
    return new Intl.NumberFormat("vi-VN").format(Math.round(Number(value || 0)));
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function throwIfAborted(signal) {
    if (signal?.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function escapeMarkdown(value) {
    return String(value).replaceAll("`", "\\`");
  }

  function createId() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
  }

  function iconSvg(name) {
    return `<i data-lucide="${name}"></i>`;
  }

  function refreshIcons() {
    window.lucide?.createIcons();
  }
})();
