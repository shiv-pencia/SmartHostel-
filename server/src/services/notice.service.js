import Notice from "../models/notice.model.js";

export const createNotice = async ({
    title,
    content,
    category,
    priority,
    targetHostel,
    publishedBy,
}) => {
    const notice = await Notice.create({
        title,
        content,
        category,
        priority,
        targetHostel: targetHostel || null,
        publishedBy,
    });

    return notice.toSafeObject();
};

export const listNotices = async ({
    category,
    priority,
    hostelId,
    limit = 50,
} = {}) => {
    const filter = { isActive: true };

    if (category) filter.category = category;
    if (priority) filter.priority = priority;

    if (hostelId) {
        filter.$or = [
            { targetHostel: null },
            { targetHostel: hostelId },
        ];
    }

    const notices = await Notice.find(filter)
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .populate("publishedBy", "name role")
        .populate("targetHostel", "name code")
        .lean();

    return notices.map((n) => ({
        id: String(n._id),
        title: n.title,
        content: n.content,
        category: n.category,
        priority: n.priority,
        targetHostel: n.targetHostel
            ? { id: String(n.targetHostel._id), name: n.targetHostel.name, code: n.targetHostel.code }
            : null,
        publishedBy: n.publishedBy
            ? { id: String(n.publishedBy._id), name: n.publishedBy.name, role: n.publishedBy.role }
            : null,
        createdAt: n.createdAt,
    }));
};
