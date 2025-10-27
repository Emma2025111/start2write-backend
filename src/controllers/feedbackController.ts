import type { Request, Response } from "express";
import { Parser as Json2CsvParser } from "json2csv";
import ExcelJS from "exceljs";
import type { FilterQuery } from "mongoose";
import asyncHandler from "../utils/asyncHandler";
import Feedback, { type FeedbackDocument } from "../models/Feedback";

const feedbackSchema = {
  easeOfUse: true,
  featureClarity: true,
  designImpression: true,
  explanationHelpfulness: true,
  usefulFeedbackTypes: true,
  confidenceLevel: true,
  likedMost: true,
  improvements: true,
  useAgain: true,
  languageBackground: true,
  studyLevel: true,
} as const;

type FeedbackFields = keyof typeof feedbackSchema;

const feedbackFields: FeedbackFields[] = Object.keys(feedbackSchema) as FeedbackFields[];
const sortableFields = [...feedbackFields, "createdAt", "updatedAt"] as const;
type SortableField = (typeof sortableFields)[number];

export const createFeedback = asyncHandler(async (req: Request, res: Response) => {
  const payload = req.body as Partial<Record<FeedbackFields, string | string[]>>;

  for (const field of feedbackFields) {
    if (payload[field] === undefined || payload[field] === "") {
      return res.status(400).json({ success: false, message: `Missing field: ${field}` });
    }
  }

  const feedback = await Feedback.create({
    easeOfUse: String(payload.easeOfUse),
    featureClarity: String(payload.featureClarity),
    designImpression: String(payload.designImpression),
    explanationHelpfulness: String(payload.explanationHelpfulness),
    usefulFeedbackTypes: Array.isArray(payload.usefulFeedbackTypes) ? payload.usefulFeedbackTypes : [],
    confidenceLevel: String(payload.confidenceLevel),
    likedMost: String(payload.likedMost),
    improvements: String(payload.improvements),
    useAgain: String(payload.useAgain),
    languageBackground: String(payload.languageBackground),
    studyLevel: String(payload.studyLevel),
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  });

  res.status(201).json({ success: true, feedbackId: feedback.id });
});

function buildFeedbackQuery(req: Request): FilterQuery<FeedbackDocument> {
  const query: FilterQuery<FeedbackDocument> = {};
  const { useAgain, startDate, endDate, search } = req.query as Record<string, string | undefined>;

  if (useAgain) {
    query.useAgain = useAgain;
  }

  if (startDate || endDate) {
    query.createdAt = {} as any;
    if (startDate) {
      query.createdAt.$gte = new Date(startDate);
    }
    if (endDate) {
      query.createdAt.$lte = new Date(endDate);
    }
  }

  if (search) {
    const regex = new RegExp(search, "i");
    query.$or = [{ likedMost: regex }, { improvements: regex }, { usefulFeedbackTypes: regex }, { languageBackground: regex }, { studyLevel: regex }];
  }

  return query;
}

export const listFeedback = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page ?? 1);
  const limit = Math.min(Number(req.query.limit ?? 20), 200);
  const sortField = (req.query.sortField as SortableField | undefined) ?? "createdAt";
  const sortOrder = (req.query.sortOrder as "asc" | "desc" | undefined) ?? "desc";

  const query = buildFeedbackQuery(req);

  const [total, data] = await Promise.all([
    Feedback.countDocuments(query),
    Feedback.find(query)
      .sort({ [sortField]: sortOrder === "asc" ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(limit),
  ]);

  res.json({
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

export const exportFeedback = asyncHandler(async (req: Request, res: Response) => {
  const format = (req.query.format as "csv" | "xlsx" | undefined) ?? "csv";
  const query = buildFeedbackQuery(req);
  const data = await Feedback.find(query).sort({ createdAt: -1 }).lean();

  if (format === "xlsx") {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Feedback");

    sheet.columns = [
      { header: "Submitted At", key: "createdAt", width: 24 },
      ...feedbackFields.map((field) => ({ header: field, key: field, width: 18 })),
      { header: "IP", key: "ipAddress", width: 18 },
      { header: "User Agent", key: "userAgent", width: 40 },
    ];

    data.forEach((item) => {
      sheet.addRow({
        createdAt: item.createdAt,
        ...feedbackFields.reduce<Record<string, string>>((acc, field) => {
          const value = (item as any)[field];
          acc[field] = Array.isArray(value) ? value.join(", ") : String(value ?? "");
          return acc;
        }, {}),
        ipAddress: item.ipAddress ?? "",
        userAgent: item.userAgent ?? "",
      });
    });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", 'attachment; filename="feedback-export.xlsx"');

    await workbook.xlsx.write(res);
    res.end();
    return;
  }

  const parser = new Json2CsvParser({
    fields: [
      { label: "Submitted At", value: (row) => row.createdAt?.toISOString?.() ?? "" },
      ...feedbackFields.map((field) => ({
        label: field,
        value: (row) => {
          const value = row[field];
          return Array.isArray(value) ? value.join("; ") : value;
        },
      })),
      { label: "IP", value: (row) => row.ipAddress ?? "" },
      { label: "User Agent", value: (row) => row.userAgent ?? "" },
    ],
  });

  const csv = parser.parse(data);
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", 'attachment; filename="feedback-export.csv"');
  res.send(csv);
});

export const feedbackStats = asyncHandler(async (_req: Request, res: Response) => {
  const [total, recent] = await Promise.all([Feedback.countDocuments(), Feedback.find().sort({ createdAt: -1 }).limit(10)]);

  res.json({ success: true, total, recent });
});

export const deleteFeedback = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const feedback = await Feedback.findByIdAndDelete(id);

  if (!feedback) {
    return res.status(404).json({ success: false, message: "Feedback not found" });
  }

  res.json({ success: true, message: "Feedback deleted successfully" });
});
