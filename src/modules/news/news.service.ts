import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { News } from '@prisma/client';
import { CreateNewsDto } from './dto/create-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';

@Injectable()
export class NewsService {
  constructor(private prisma: PrismaService) {}

  async findAll(publishedOnly: boolean = false, page: number = 1, limit: number = 10): Promise<{ news: News[], pagination: any }> {
    const skip = (page - 1) * limit;
    
    const where = publishedOnly ? { published: true } : {};
    
    const [news, total] = await Promise.all([
      this.prisma.news.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      this.prisma.news.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      news,
      pagination: {
        total,
        totalPages,
        currentPage: page,
        itemsPerPage: limit,
      },
    };
  }

  async findOne(id: string): Promise<News> {
    const news = await this.prisma.news.findUnique({ where: { id } });
    
    if (!news) {
      throw new NotFoundException(`Actualité avec l'ID ${id} non trouvée`);
    }
    
    return news;
  }

  async create(data: CreateNewsDto): Promise<News> {
    return this.prisma.news.create({ data });
  }

  async update(id: string, data: UpdateNewsDto): Promise<News> {
    // Vérifier si l'actualité existe
    await this.findOne(id);
    
    return this.prisma.news.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  async remove(id: string): Promise<void> {
    // Vérifier si l'actualité existe
    await this.findOne(id);
    
    await this.prisma.news.delete({ where: { id } });
  }
}