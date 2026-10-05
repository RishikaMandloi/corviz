import { Types } from "mongoose";

import { AppError } from "../../errors";

import { Video } from "./video.model";

import {
  VERIFICATION_STATUS,
  VIDEO_STATUS,
} from "./video.constants";

class VideoService {
  /**
   * Create Video
   */
  async createVideo(
    payload: {
      title: string;
      concept: string;
      description?: string;
      scenes?: unknown[];
    }
  ) {
    const video =
      await Video.create({
        title: payload.title,
        concept: payload.concept,
        description:
          payload.description,
        scenes:
          payload.scenes || [],
      });

    return video;
  }

  /**
   * Get Video By ID
   */
  async getVideoById(
    id: string
  ) {
    if (
      !Types.ObjectId.isValid(id)
    ) {
      throw new AppError(
        "Invalid video ID.",
        400
      );
    }

    const video =
      await Video.findById(id);

    if (!video) {
      throw new AppError(
        "Video not found.",
        404
      );
    }

    return video;
  }

  /**
   * Get All Videos
   */
  async getVideos() {
    return Video.find()
      .sort({
        createdAt: -1,
      });
  }

  /**
   * Update Video
   */
  async updateVideo(
    id: string,
    payload: {
      title?: string;
      description?: string;
      scenes?: unknown[];
    }
  ) {
    if (
      !Types.ObjectId.isValid(id)
    ) {
      throw new AppError(
        "Invalid video ID.",
        400
      );
    }

    const video =
      await Video.findById(id);

    if (!video) {
      throw new AppError(
        "Video not found.",
        404
      );
    }

    /**
     * Prevent manually changing
     * system-controlled states.
     */
    if (
      video.status ===
        VIDEO_STATUS.RENDERING ||
      video.status ===
        VIDEO_STATUS.VERIFYING
    ) {
      throw new AppError(
        "Video cannot be modified while processing.",
        409
      );
    }

    Object.assign(
      video,
      payload
    );

    /**
     * Recalculate total duration
     */
    if (
      video.scenes.length > 0
    ) {
      video.totalDuration =
        video.scenes.reduce(
          (
            total,
            scene
          ) =>
            total +
            scene.duration,
          0
        );
    } else {
      video.totalDuration = 0;
    }

    /**
     * Any scene modification
     * invalidates previous verification.
     */
    video.verificationStatus =
      VERIFICATION_STATUS.PENDING;

    video.status =
      VIDEO_STATUS.DRAFT;

    await video.save();

    return video;
  }

  /**
   * Delete Video
   */
  async deleteVideo(
    id: string
  ) {
    if (
      !Types.ObjectId.isValid(id)
    ) {
      throw new AppError(
        "Invalid video ID.",
        400
      );
    }

    const video =
      await Video.findById(id);

    if (!video) {
      throw new AppError(
        "Video not found.",
        404
      );
    }

    if (
      video.status ===
        VIDEO_STATUS.RENDERING ||
      video.status ===
        VIDEO_STATUS.VERIFYING
    ) {
      throw new AppError(
        "Video cannot be deleted while processing.",
        409
      );
    }

    await video.deleteOne();
  }
}

export const videoService =
  new VideoService();